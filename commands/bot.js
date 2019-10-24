const { getOrderBook } = require('../services/getOrderBook')
const { getLatestPrice } = require('../services/coingecko')
const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')

let defaultAmount = 1 // TOMO
let minimumPriceStepChange = 1 // TOMO
let FIXA = 1 // amount decimals
let FIXP = 1 // price decimals
let ORDERBOOK_LENGTH = config.get('orderbookLength') // number of order in orderbook
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

        let buy = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.bids.length, 'BUY')
        let sell = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.asks.length, 'SELL')
        let nonce = sell.nonce || buy.nonce
        let hash = sell.hash || buy.hash

        if (orderBookData.asks.length >= ORDERBOOK_LENGTH
            && orderBookData.bids.length >= ORDERBOOK_LENGTH) {
            console.log('MATCHED ORDER !!!')
            return match()
        }

        if (Math.floor(Math.random() * 4) == 2 && hash) {
            await sleep(4000)
            await cancel(hash, nonce)
        }

    } catch (err) {
        console.log(err)
    }
}

const fillOrderbook = async (len, side) => {
    let nonce = 0
    let hash = 0
    if (len <= 0) return { nonce,  hash }

    try {
        const latestPrice = await getLatestPrice(pair)
        let amount = defaultAmount
        let orders = []
        for (let i = 0; i < len; i++) {
            let price = (side === 'BUY' ? latestPrice - (i + 1) * len * minimumPriceStepChange
                : latestPrice + (i + 1) * len * minimumPriceStepChange)
            let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1
            let o = {
                baseToken: baseToken,
                quoteToken: quoteToken,
                price: price.toFixed(FIXP),
                amount: (amount * ranNum).toFixed(FIXA),
                side: side
            }
            orders.push(o)
        }
        let ret = await tomox.createManyOrders(orders)
        orders.forEach((or, k) => {
            hash = ret[k].hash
            nonce = ret[k].nonce
            console.log(side, pair, or.price, or.amount, ret[k].hash, ret[k].nonce)
        })
        return { nonce, hash } 
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

        let side = (ranNum % 2) ? 'BUY' : 'SELL'
        const bestBid = orderBookData.asks[ORDERBOOK_LENGTH - 1]
        const bestAsk = orderBookData.bids[ORDERBOOK_LENGTH - 1]
        const latestPrice = await getLatestPrice(pair)
        let amount = (ranNum * defaultAmount).toFixed(FIXA).toString()
        let price = (side === 'SELL') ? (bestAsk.pricepoint / 10 ** 18).toFixed(FIXP)
            : (bestBid.pricepoint / 10 ** 18).toFixed(FIXP)
        await createOrder(price, amount, side)

    } catch (err) {
        console.log(err)
    }
}

const run = async (p) => {
    tomox = new TomoX(config.get('relayerUrl'), config[p].pkey)
    pair = p || 'BTCTOMO'
    baseToken = config[p].baseToken
    quoteToken = config[p].quoteToken

    let price = parseFloat(await getLatestPrice(pair))
    minimumPriceStepChange = price*(1 / 1000)
    if ((1 / parseFloat(price)) > 10) {
        FIXA = 3 
        FIXP = 3
        minimumPriceStepChange = price * (5 / 1000)
    }
    if ((1 / parseFloat(price)) > 100) {
        FIXA = 5
        FIXP = 5
        defaultAmount = 10
        minimumPriceStepChange = price * (1 / 1000)
    }
    if ((1 / parseFloat(price)) > 1000) {
        FIXA = 7
        FIXP = 7
        defaultAmount = 100
        minimumPriceStepChange = (5 / 100) * price
    }

    while(true) {
        await runMarketMaker()
        await sleep(4000)
    }
}

module.exports = { run }
