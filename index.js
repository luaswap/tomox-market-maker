const { getOrderBook } = require('./services/getOrderBook')
const { getLatestPrice } = require("./services/coingecko")
require('dotenv').config()
const TomoX = require('tomoxjs')
const BigNumber = require("bignumber.js")

const tomox = new TomoX(process.env.RELAYER_URL, process.env.MARKET_MAKER_PRIVATE_KEY)
const defaultAmount = 10000 // TOMO
const minimumPriceStepChange = 1 // TOMO
const FIXA = 1
const FIXP = 0

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
            console.log('BUY BTC/TOMO', price, amount, o.nonce)
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
            console.log('SELL BTC/TOMO', price, amount, o.nonce)
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
        let amount = (defaultAmount/latestPrice).toFixed(FIXA).toString()
        let price = (side === 'BUY' ? latestPrice - 0.0001 * latestPrice : latestPrice + 0.0001 * latestPrice).toFixed(FIXP)
        let o = await tomox.createOrder({
            baseToken: process.env.BTC_ADDRESS,
            quoteToken: process.env.TOMO_ADDRESS,
            price: price,
            amount: amount,
            side: side
        })
        console.log('BUY BTC/TOMO', price, amount, o.nonce)
    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}

const cancel = async (hash, nonce) => {
    const oc = await tomox.cancelOrder(hash, nonce)
    console.log('CANCEL BTC/TOMO', hash, nonce)
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
                let amount = (4 * defaultAmount/latestPrice).toFixed(FIXA).toString()
                let price = (bestBid.pricepoint / 10 ** 18).toFixed(FIXP)
                let side = 'BUY'
                let o = await tomox.createOrder({
                    baseToken: process.env.BTC_ADDRESS,
                    quoteToken: process.env.TOMO_ADDRESS,
                    price: price,
                    amount: amount,
                    side: side
                })
                console.log('BUY BTC/TOMO', price, amount, o.nonce, 'MATCHED')

            }
        } else {
            if (orderBookData.bids.length > 4) {
                const bestAsk = orderBookData.bids[4]
                const latestPrice = await getLatestPrice()
                let amount = (4 * defaultAmount/latestPrice).toFixed(FIXA).toString()
                let price = (bestAsk.pricepoint / 10 ** 18).toFixed(FIXP)
                let side = 'SELL'

                // await createOrder(newAskOrder)
                let o = await tomox.createOrder({
                    baseToken: process.env.BTC_ADDRESS,
                    quoteToken: process.env.TOMO_ADDRESS,
                    price: price,
                    amount: amount,
                    side: side
                })
                console.log('SELL BTC/TOMO', price, amount, o.nonce, 'MATCHED')
            }
        }

    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}


const calculateBetterBid = (currentBestBid) => {
    const newBidOrder = {
        amount: (defaultAmount/(currentBestBid.pricepoint/1e+18)).toFixed(FIXA),
        price: (new BigNumber(currentBestBid.pricepoint/1e+18).plus(minimumPriceStepChange)).toFixed(FIXP).toString()
    }

    return newBidOrder
}

const calculateBetterAsk = (currentBestAsk) => {
    const newAskOrder = {
        amount: (defaultAmount/(currentBestAsk.pricepoint/1e+18)).toFixed(FIXA),
        price: (new BigNumber(currentBestAsk.pricepoint/1e+18).minus(minimumPriceStepChange)).toFixed(FIXP).toString()
    }

    return newAskOrder
}

/**
 * Fetch order book
 */
runMarketMaker()

