const { getOrderBook } = require('./services/getOrderBook')
const { getLatestPrice } = require("./services/coingecko")
require('dotenv').config()
const TomoX = require('tomoxjs')
const BigNumber = require("bignumber.js")

const tomox = new TomoX(process.env.RELAYER_URL, process.env.MARKET_MAKER_PRIVATE_KEY)
const defaultAmount = 1000 // TOMO
const minimumPriceStepChange = 1 // TOMO

const runMarketMaker = async () => {
    let hash = false
    let nonce = 0
    try {
        const orderBookData = await getOrderBook(process.env.BTC_ADDRESS, process.env.TOMO_ADDRESS)
        if (!orderBookData) {
            return
        }

        if (orderBookData.bids.length === 0) {
            return await handleEmptyOrderbook('BUY')
        }

        if (orderBookData.asks.length === 0) {
            return await handleEmptyOrderbook('SELL')
        }

        if (orderBookData.bids.length <= orderBookData.asks.length) {
            const bestBid = orderBookData.bids[0]
            let { price, amount } = calculateBetterBid(bestBid)
            let o = await tomox.createOrder({
                baseToken: process.env.BTC_ADDRESS,
                quoteToken: process.env.TOMO_ADDRESS,
                price: price,
                amount: amount,
                side: 'BUY'
            })
            hash = o.hash
            nonce = parseInt(o.nonce) + 1
            console.log('BUY BTC/TOMO', price, amount)
        } else {
            const bestAsk = orderBookData.asks[0]
            let { price, amount }= calculateBetterAsk(bestAsk)
            let o = await tomox.createOrder({
                baseToken: process.env.BTC_ADDRESS,
                quoteToken: process.env.TOMO_ADDRESS,
                price: price,
                amount: amount,
                side: 'SELL'
            })
            hash = o.hash
            nonce = parseInt(o.nonce) + 1
            console.log('SEL BTC/TOMO', price, amount)
        }

    } catch (err) {
        console.log(err)
    }
    if (Math.floor(Math.random() * 5) == 2 && hash) {
        await cancel(hash, nonce)
    }
    setTimeout(match, 10000);
}

const handleEmptyOrderbook = async (side) => {
    try {
        const latestPrice = await getLatestPrice()
        let amount = (defaultAmount/latestPrice).toString()
        let price = side === 'BUY' ? latestPrice - 0.01 * latestPrice : latestPrice + 0.01 * latestPrice
        let o = await tomox.createOrder({
            baseToken: process.env.BTC_ADDRESS,
            quoteToken: process.env.TOMO_ADDRESS,
            price: price,
            amount: amount,
            side: side
        })
        console.log('BUY BTC/TOMO', price, amount)
    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}

const cancel = async (hash, nonce) => {
    const oc = await tomox.cancelOrder(hash, nonce)
    console.log('CANCEL BTC/TOMO', hash)
}

const match = async () => {
    try {
        const orderBookData = await getOrderBook(process.env.BTC_ADDRESS, process.env.TOMO_ADDRESS)
        if (!orderBookData) {
            process.exit(0)
            return
        }

        if (orderBookData.asks.length > orderBookData.bids.length) {
            if (orderBookData.asks.length > 4) {
                const bestBid = orderBookData.asks[4]
                const latestPrice = await getLatestPrice()
                let amount = (4 * defaultAmount/latestPrice).toString()
                let price = bestBid.pricepoint / 10 ** 18
                let side = 'BUY'
                let o = await tomox.createOrder({
                    baseToken: process.env.BTC_ADDRESS,
                    quoteToken: process.env.TOMO_ADDRESS,
                    price: price,
                    amount: amount,
                    side: side
                })
                console.log('BUY BTC/TOMO', price, amount, 'MATCHED')

            }
        } else {
            if (orderBookData.bids.length > 4) {
                const bestAsk = orderBookData.bids[4]
                const latestPrice = await getLatestPrice()
                let amount = (4 * defaultAmount/latestPrice).toString()
                let price = bestAsk.pricepoint / 10 ** 18
                let side = 'SELL'

                // await createOrder(newAskOrder)
                let o = await tomox.createOrder({
                    baseToken: process.env.BTC_ADDRESS,
                    quoteToken: process.env.TOMO_ADDRESS,
                    price: price,
                    amount: amount,
                    side: side
                })
                console.log('SELL BTC/TOMO', price, amount, 'MATCHED')
            }
        }

    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}


const calculateBetterBid = (currentBestBid) => {
    const newBidOrder = {
        amount: defaultAmount/(currentBestBid.pricepoint/1e+18),
        price: (new BigNumber(currentBestBid.pricepoint/1e+18).plus(minimumPriceStepChange)).toString()
    }

    return newBidOrder
}

const calculateBetterAsk = (currentBestAsk) => {
    const newAskOrder = {
        amount: defaultAmount/(currentBestAsk.pricepoint/1e+18),
        price: (new BigNumber(currentBestAsk.pricepoint/1e+18).minus(minimumPriceStepChange)).toString()
    }

    return newAskOrder
}

/**
 * Fetch order book
 */
runMarketMaker()

