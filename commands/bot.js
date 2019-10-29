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
let pair = 'BTCTOMO'
let baseToken = config.get(`${pair}.baseToken`)
let quoteToken = config.get(`${pair}.quoteToken`)
let TOKEN_DECIMALS = 1e18
let EX_DECIMALS = 1e8

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

        if (orderBookData.asks.length >= ORDERBOOK_LENGTH
            && orderBookData.bids.length >= ORDERBOOK_LENGTH) {
            console.log('MATCHED ORDER !!!')
            return match()
        }


        let askPrice = (orderBookData.asks.length > 0 ) ? orderBookData.asks[orderBookData.asks.length - 1].pricepoint / 10 ** 18 : 0
        let bidPrice = (orderBookData.bids.length > 0) ? orderBookData.bids[orderBookData.bids.length - 1].pricepoint / 10 ** 18 : 0

        if (askPrice != 0 && bidPrice != 0) {
            let latestAskPrice = orderBookData.asks[0].pricepoint / TOKEN_DECIMALS
            let latestBidPrice = orderBookData.bids[0].pricepoint / TOKEN_DECIMALS
            // let check = minimumPriceStepChange.multipliedBy(ORDERBOOK_LENGTH).dividedBy(EX_DECIMALS).plus(latestBidPrice).isLessThan(latestAskPrice)
            let check = minimumPriceStepChange
                .multipliedBy((2 * ORDERBOOK_LENGTH) - orderBookData.bids.length - orderBookData.asks.length)
                .dividedBy(EX_DECIMALS).plus(latestBidPrice).isLessThan(latestAskPrice)

            if (check) {
                bidPrice = latestAskPrice
                askPrice = latestBidPrice
            }
        }

        let buy = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.bids.length, 'BUY', 0, bidPrice)
        let sell = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.asks.length, 'SELL', buy.nonce, askPrice)
        let nonce = sell.nonce || buy.nonce
        let hash = sell.hash || buy.hash

        if (Math.floor(Math.random() * 4) == 2 && hash) {
            await sleep(4000)
            await cancel(hash, nonce)
        }

    } catch (err) {
        console.log(err)
    }
}

const fillOrderbook = async (len, side, nonce = 0, latestPrice = 0) => {
    let hash = 0
    if (len <= 0) return { nonce,  hash }

    try {
        let k = 1
        if (latestPrice === 0) {
            k = 2
            latestPrice = new BigNumber(await getLatestPrice(pair)).multipliedBy(1e8)
        } else {
            latestPrice = new BigNumber(latestPrice).multipliedBy(1e8)
        }
        let amount = defaultAmount
        let orders = []
        for (let i = 0; i < len; i++) {
            let step = minimumPriceStepChange.multipliedBy(i + 1)
            let price = (side === 'BUY') ? latestPrice.minus(step)
                : latestPrice.plus(step)
            let ranNum = Math.floor(Math.random() * ORDERBOOK_LENGTH) + 1

            let o = {
                baseToken: baseToken,
                quoteToken: quoteToken,
                price: price.dividedBy(1e8).toFixed(FIXP),
                amount: (amount * ranNum).toFixed(FIXA),
                side: side,
            }
            if (nonce != 0) {
                o.nonce = parseInt(nonce) + i + 1
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
    pair = p || 'BTCTOMO'
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

    while(true) {
        await runMarketMaker()
        await sleep(50000) // 50 seconds
    }
}

module.exports = { run }
