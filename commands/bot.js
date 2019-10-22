const { getOrderBook } = require('../services/getOrderBook')
const { getLatestPrice } = require('../services/coingecko')
const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')

let defaultAmount = 10000 // TOMO
let minimumPriceStepChange = 1 // TOMO
let FIXA = 1 // amount decimals
let FIXP = 0 // price decimals
let ORDERBOOK_LENGTH = 5 // number of order in orderbook
let tomox = new TomoX()
let pair = 'BTCTOMO'
let baseToken = config.get(`${pair}.baseToken`)
let quoteToken = config.get(`${pair}.quoteToken`)

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const createOrder = async (price, amount, side) => {
    let o = await tomox.createOrder({
        baseToken: baseToken,
        quoteToken: quoteToken,
        price: price,
        amount: amount,
        side: side
    })
    console.log(side, pair, price, amount, o.hash, o.nonce)
    return o
}

const runMarketMaker = async () => {
    let hash = false
    let nonce = 0
    try {
        const orderBookData = await getOrderBook(baseToken, quoteToken)
        if (!orderBookData) {
            return
        }

        if (orderBookData.bids.length === 0) {
            return handleEmptyOrderbook('BUY')
        }

        if (orderBookData.asks.length === 0) {
            return handleEmptyOrderbook('SELL')
        }

        if (orderBookData.asks.length >= ORDERBOOK_LENGTH
            && orderBookData.bids.length >= ORDERBOOK_LENGTH) {
            console.log('MATCHED ORDER !!!')
            return match()
        }

        let side = 'SELL'
        if (orderBookData.bids.length <= orderBookData.asks.length) {
            side = 'BUY'
        }
        let { price, amount } = await calculateOrder(side)
        let o = await createOrder(price, amount, side)

        hash = o.hash
        nonce = parseInt(o.nonce) + 1

        if (Math.floor(Math.random() * 5) == 2 && hash) {
            await sleep(4000)
            await cancel(hash, nonce)
        }

    } catch (err) {
        console.log(err)
    }
}

const handleEmptyOrderbook = async (side) => {
    let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
    try {
        const latestPrice = await getLatestPrice(pair)
        let amount = defaultAmount / latestPrice
        let price = (side === 'BUY' ? latestPrice - (ORDERBOOK_LENGTH - 1) * minimumPriceStepChange
            : latestPrice + (ORDERBOOK_LENGTH - 1) * minimumPriceStepChange)
        let orders = []
        for (let i = 0; i < ORDERBOOK_LENGTH - 1; i++) {
            let o = {
                baseToken: baseToken,
                quoteToken: quoteToken,
                price: (price + (i * minimumPriceStepChange)).toFixed(FIXP),
                amount: (amount * ranNum).toFixed(FIXA),
                side: side
            }
            orders.push(o)
        }
        let ret = await tomox.createManyOrders(orders)
        orders.forEach((or, k) => {
            console.log(side, pair, or.price, or.amount, ret[k].hash, ret[k].nonce)
        })
    } catch (err) {
        console.log(err)
    }
}

const cancel = async (hash, nonce) => {
    const oc = await tomox.cancelOrder(hash, nonce)
    console.log('CANCEL', pair, hash, nonce)
}

const match = async () => {
    let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
    try {
        const orderBookData = await getOrderBook(baseToken, quoteToken)
        if (!orderBookData) {
            return
        }

        if (orderBookData.asks.length >= orderBookData.bids.length) {
            if (orderBookData.asks.length >= ORDERBOOK_LENGTH) {
                const bestBid = orderBookData.asks[ORDERBOOK_LENGTH - 1]
                const latestPrice = await getLatestPrice(pair)
                let amount = (ranNum * defaultAmount/latestPrice).toFixed(FIXA).toString()
                let price = (bestBid.pricepoint / 10 ** 18).toFixed(FIXP)
                let side = 'BUY'
                let o = await createOrder(price, amount, side)

            }
        } else {
            if (orderBookData.bids.length >= ORDERBOOK_LENGTH) {
                const bestAsk = orderBookData.bids[ORDERBOOK_LENGTH - 1]
                const latestPrice = await getLatestPrice(pair)
                let amount = (ranNum * defaultAmount/latestPrice).toFixed(FIXA).toString()
                let price = (bestAsk.pricepoint / 10 ** 18).toFixed(FIXP)
                let side = 'SELL'

                let o = await createOrder(price, amount, side)
            }
        }

    } catch (err) {
        console.log(err)
    }
}

const calculateOrder = async (side) => {
    let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
    const latestPrice = await getLatestPrice(pair)
    let amount = (defaultAmount/latestPrice).toFixed(FIXA)
    let price = side === 'BUY' ? ((latestPrice - ranNum * minimumPriceStepChange)).toFixed(FIXP)
        : ((latestPrice + ranNum * minimumPriceStepChange)).toFixed(FIXP)

    return { price, amount }
}


const run = async (p) => {
    tomox = new TomoX(config.get('relayerUrl'), config[p].pkey)
    pair = p || 'BTCTOMO'
    baseToken = config[p].baseToken
    quoteToken = config[p].quoteToken

    FIXA = 5 // amount decimals
    FIXP = 5 // price decimals
    let latestPrice = parseFloat((await getLatestPrice(pair)).toFixed(FIXP))
    defaultAmount = parseFloat((latestPrice/3).toFixed(FIXA))
    minimumPriceStepChange = latestPrice * (5 / 1000)
    while(true) {
        await runMarketMaker()
        await sleep(4000)
    }
}

module.exports = { run }
