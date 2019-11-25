const { getOrderBook } = require('../services/getOrderBook')
const { getLatestPrice } = require('../services/coingecko')
const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')

let defaultAmount = 1 // TOMO
let minimumPriceStepChange = 1 // TOMO
let FIXA = 5 // amount decimals
let FIXP = 7 // price decimals
let ORDERBOOK_LENGTH = config.get('orderbookLength') // number of order in orderbook
let tomox = new TomoX()
let pair = 'BTC-TOMO'
let baseToken = config.get(`${pair}.baseToken`)
let quoteToken = config.get(`${pair}.quoteToken`)
let TOKEN_DECIMALS = 1e18
let EX_DECIMALS = 1e8

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
let sellPrices = []
let buyPrices = []

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

        if (orderBookData.asks.length >= ORDERBOOK_LENGTH
            && orderBookData.bids.length >= ORDERBOOK_LENGTH) {
            console.log('MATCHED ORDER !!!')
            return match()
        }


        let askPrice = (orderBookData.asks.length > 0 ) ? orderBookData.asks[0].pricepoint / TOKEN_DECIMALS : 0
        let bidPrice = (orderBookData.bids.length > 0) ? orderBookData.bids[0].pricepoint / TOKEN_DECIMALS : 0

        sellPrices = []
        buyPrices = []

        orderBookData.asks.forEach(a => sellPrices.push(new BigNumber(a.pricepoint).dividedBy(TOKEN_DECIMALS).toFixed(FIXP)))
        orderBookData.bids.forEach(b => buyPrices.push(new BigNumber(b.pricepoint).dividedBy(TOKEN_DECIMALS).toFixed(FIXP)))

        let buy = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.bids.length, 'BUY', 0, askPrice)
        let sell = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.asks.length, 'SELL', (buy || {}).nonce, bidPrice)
        let nonce = (sell || {}).nonce || (buy || {}).nonce
        let hash = (sell || {}).hash || (buy || {}).hash

        let isCancel = config[pair].cancel || config.cancel || false
        if (Math.floor(Math.random() * 4) == 2 && hash && isCancel) {
            await sleep(4000)
            await cancel(hash, nonce)
        }

    } catch (err) {
        console.log(err)
    }
}

const findGoodPrice = (side, latestPrice) => {
    let i = 1
    while (true) {
        let step = minimumPriceStepChange.multipliedBy(i)
        let price = (side === 'BUY') ? latestPrice.minus(step)
            : latestPrice.plus(step)
        let pricepoint = price.dividedBy(EX_DECIMALS).toFixed(FIXP)

        if (side === 'BUY' && buyPrices.indexOf(pricepoint) < 0) {
            buyPrices.push(pricepoint)
            return price
        } else if (side !== 'BUY' && sellPrices.indexOf(pricepoint) < 0) {
            sellPrices.push(pricepoint)
            return price
        } else {
            i = i + 1
        }
    }
}

const fillOrderbook = async (len, side, nonce = 0, latestPrice = 0) => {
    let hash = 0
    if (len <= 0) return { nonce,  hash }

    try {
        if (latestPrice === 0) {
            latestPrice = new BigNumber(await getLatestPrice(pair)).multipliedBy(1e8)
        } else {
            latestPrice = new BigNumber(latestPrice).multipliedBy(1e8)
        }
        let amount = defaultAmount
        let orders = []
        for (let i = 0; i < len; i++) {
            let price = findGoodPrice(side, latestPrice)
            let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1

            let o = {
                baseToken: baseToken,
                quoteToken: quoteToken,
                price: price.dividedBy(1e8).toFixed(FIXP),
                amount: (amount * ranNum).toFixed(FIXA),
                side: side,
            }
            if (nonce != 0) {
                o.nonce = parseInt(nonce) + i
            }
            orders.push(o)
        }

        let ret = await tomox.createManyOrders(orders)
        orders.forEach((or, k) => {
            hash = ret[k].hash
            nonce = ret[k].nonce
            console.log(side, pair, or.price, or.amount, ret[k].hash, ret[k].nonce)
        })
        return { nonce:  parseInt(nonce) + 1, hash: hash }
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
        let amount = (ranNum * defaultAmount).toFixed(FIXA)
        let price = (side === 'SELL') ? (bestAsk.pricepoint / 10 ** 18).toFixed(FIXP)
            : (bestBid.pricepoint / 10 ** 18).toFixed(FIXP)
        await createOrder(price, amount, side)

    } catch (err) {
        console.log(err)
    }
}

const run = async (p) => {
    tomox = new TomoX(config.get('relayerUrl'), config[p].pkey)
    pair = p || 'BTC-TOMO'
    ORDERBOOK_LENGTH = config[p].orderbookLength || config.get('orderbookLength') || 5
    baseToken = config[p].baseToken
    quoteToken = config[p].quoteToken

    let price = new BigNumber(parseFloat(await getLatestPrice(pair))).multipliedBy(EX_DECIMALS)
    minimumPriceStepChange = price.dividedBy(1e3)

    if (pair.endsWith('BTC')) {
        defaultAmount = parseFloat(new BigNumber(1).dividedBy(price).multipliedBy(EX_DECIMALS).multipliedBy(0.001).toFixed(FIXA))
        minimumPriceStepChange = price.dividedBy(1e2)
    } else {
        defaultAmount = parseFloat(new BigNumber(1).dividedBy(price).multipliedBy(EX_DECIMALS).multipliedBy(100).toFixed(FIXA))
    }

    if (defaultAmount > 1) {
        FIXA = 2
    }

    if (minimumPriceStepChange.isGreaterThan(1e+8)) {
        FIXP = 2
    }

    let speed = config[pair].speed || config.speed || 50000
    while(true) {
        await runMarketMaker()
        await sleep(speed)
    }
}

module.exports = { run }
