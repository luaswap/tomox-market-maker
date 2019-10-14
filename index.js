const { getOrderBook } = require('./services/getOrderBook')
const { getLatestPrice } = require("./services/coingecko")
require('dotenv').config()
const TomoX = require('tomoxjs')
const BigNumber = require("bignumber.js")

const tomox = new TomoX(process.env.RELAYER_URL, process.env.MARKET_MAKER_PRIVATE_KEY)
const defaultAmount = 10000 // TOMO
const minimumPriceStepChange = 1 // TOMO
const FIXA = 1 // amount decimals
const FIXP = 0 // price decimals
const ORDERBOOK_LENGTH = 5 // number of order in orderbook

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

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

        let side = 'SELL'
        if (orderBookData.bids.length <= orderBookData.asks.length) {
            side = 'BUY'
        }
        let { price, amount } = await calculateOrder(side)
        let o = await tomox.createOrder({
            baseToken: process.env.BTC_ADDRESS,
            quoteToken: process.env.TOMO_ADDRESS,
            price: price,
            amount: amount,
            side: side
        })
        hash = o.hash
        nonce = parseInt(o.nonce) + 1
        console.log(side, 'BTC/TOMO', price, amount, o.nonce)
        if (orderBookData.asks.length >= ORDERBOOK_LENGTH
            || orderBookData.bids.length >= ORDERBOOK_LENGTH) {
            await sleep(5000)
            await match()
        }

        if (Math.floor(Math.random() * 5) == 2 && hash) {
            await sleep(5000)
            await cancel(hash, nonce)
        }

    } catch (err) {
        console.log(err)
    }
}

const handleEmptyOrderbook = async (side) => {
    let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
    try {
        const latestPrice = await getLatestPrice()
        let amount = (defaultAmount/latestPrice).toFixed(FIXA).toString()
        let price = (side === 'BUY' ? latestPrice - (ORDERBOOK_LENGTH - 1) * minimumPriceStepChange : latestPrice + (ORDERBOOK_LENGTH - 1) * minimumPriceStepChange)
        let orders = []
        for (let i = 0; i < ORDERBOOK_LENGTH - 1; i++) {
            let o = {
                baseToken: process.env.BTC_ADDRESS,
                quoteToken: process.env.TOMO_ADDRESS,
                price: (price + (i * minimumPriceStepChange)).toFixed(FIXP),
                amount: amount * ranNum,
                side: side
            }
            orders.push(o)
        }
        let ret = await tomox.createManyOrders(orders)
        orders.forEach((or, k) => {
            console.log('BUY BTC/TOMO', or.price, or.amount, ret[k].nonce)
        })
    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}

const cancel = async (hash, nonce) => {
    const oc = await tomox.cancelOrder(hash, nonce)
    console.log('CANCEL BTC/TOMO', hash, nonce)
    process.exit(0)
}

const match = async () => {
    let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
    try {
        const orderBookData = await getOrderBook(process.env.BTC_ADDRESS, process.env.TOMO_ADDRESS)
        if (!orderBookData) {
            process.exit(0)
            return
        }

        if (orderBookData.asks.length >= orderBookData.bids.length) {
            if (orderBookData.asks.length >= ORDERBOOK_LENGTH) {
                const bestBid = orderBookData.asks[ORDERBOOK_LENGTH - 1]
                const latestPrice = await getLatestPrice()
                let amount = (ranNum * defaultAmount/latestPrice).toFixed(FIXA).toString()
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
            if (orderBookData.bids.length >= ORDERBOOK_LENGTH) {
                const bestAsk = orderBookData.bids[ORDERBOOK_LENGTH - 1]
                const latestPrice = await getLatestPrice()
                let amount = (ranNum * defaultAmount/latestPrice).toFixed(FIXA).toString()
                let price = (bestAsk.pricepoint / 10 ** 18).toFixed(FIXP)
                let side = 'SELL'

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

const calculateOrder = async (side) => {
    let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
    const latestPrice = await getLatestPrice()
    let amount = (defaultAmount/latestPrice).toFixed(FIXA)
    let price = side === 'BUY' ? ((latestPrice - ranNum * minimumPriceStepChange)).toFixed(FIXP)
        : ((latestPrice + ranNum * minimumPriceStepChange)).toFixed(FIXP)

    return { price, amount }
}

runMarketMaker()

