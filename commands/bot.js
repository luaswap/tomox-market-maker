const { getLatestPrice, getUSDPrice } = require('../services/price')
const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')

let defaultAmount = 1 // TOMO
let minimumPriceStepChange = 1 // TOMO
let FIXA = 5 // amount decimals
let FIXP = 7 // price decimals
let ORDERBOOK_LENGTH = config.get('orderbookLength') // number of order in orderbook
let tomox = new TomoX()
let pair = 'TOMO-BTC'
let baseToken = config.get(`${pair}.baseToken`)
let quoteToken = config.get(`${pair}.quoteToken`)
let TOKEN_DECIMALS = 1e18
let BASE_TOKEN_DECIMALS = 1e18
let EX_DECIMALS = 1e8

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
let sellPrices = []
let buyPrices = []
let isFirstOrder = true

const createOrder = async (price, amount, side) => {
    let prec = calcPrecision(price)
    price = new BigNumber(price).toFixed(prec.pricePrecision)
    amount = new BigNumber(amount).toFixed(prec.amountPrecision)
    FIXP = prec.pricePrecision
    FIXA = prec.amountPrecision
    let o = await tomox.createOrder({
        baseToken: baseToken,
        quoteToken: quoteToken,
        price: price,
        amount: amount,
        side: side
    })
    console.log(`${side} pair=${pair} price=${price} amount=${amount} hash=${o.hash} nonce=${o.nonce}`)
    return o
}

const runMarketMaker = async () => {
    try {
        const orderBookData = await tomox.getOrderBook({baseToken, quoteToken})
        if (!orderBookData) {
            return
        }

        if (orderBookData.asks.length >= ORDERBOOK_LENGTH
            && orderBookData.bids.length >= ORDERBOOK_LENGTH) {
            console.log('MATCHED ORDER !!!')
            await match(orderBookData)
        }

        sellPrices = []
        buyPrices = []
        orderBookData.asks.forEach(a => sellPrices.push(new BigNumber(a.pricepoint).dividedBy(TOKEN_DECIMALS).toFixed(FIXP)))
        orderBookData.bids.forEach(b => buyPrices.push(new BigNumber(b.pricepoint).dividedBy(TOKEN_DECIMALS).toFixed(FIXP)))

        let buy = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.bids.length, 'BUY', 0)
        let sell = await fillOrderbook(ORDERBOOK_LENGTH - orderBookData.asks.length, 'SELL', (buy || {}).nonce)

        await cancelOrders((sell || {}).nonce)

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

const cancelOrders = async (nonce) => {
    let orders = (await tomox.getOrders({baseToken, quoteToken, status: 'OPEN'})).orders
    let latestPrice = new BigNumber(await getLatestPrice(pair)).multipliedBy(TOKEN_DECIMALS)
    let mmp = minimumPriceStepChange.dividedBy(EX_DECIMALS).multipliedBy(TOKEN_DECIMALS)
    let cancelHashes = orders.filter(order => {
        if (order.status !== 'OPEN') return false
        let price = new BigNumber(order.pricepoint)
        if (order.side === 'SELL' && price.isGreaterThan(latestPrice.plus(mmp.multipliedBy(ORDERBOOK_LENGTH)))) {
            return true
        }
        if (order.side === 'BUY' && price.isLessThan(latestPrice.minus(mmp.multipliedBy(ORDERBOOK_LENGTH)))) {
            return true
        }
        return false
    })
    let hashes = cancelHashes.map(c => c.hash)
    let ret = await tomox.cancelManyOrders(hashes, nonce || 0)
    ret.forEach(o => {
        console.log('CANCEL', `orderHash=${o.orderHash} orderId=${o.orderID} hash=${o.hash} nonce=${o.nonce}`)
    })
}

const fillOrderbook = async (len, side, nonce = 0) => {
    let hash = 0
    if (len <= 0) return { nonce,  hash }

    try {
        latestPrice = new BigNumber(await getLatestPrice(pair)).multipliedBy(EX_DECIMALS)
        let amount = defaultAmount
        let orders = []
        for (let i = 0; i < len; i++) {
            let price = findGoodPrice(side, latestPrice)
            let ranNum = Math.floor(Math.random() * 20) / 100 + 1

            let o = {
                baseToken: baseToken,
                quoteToken: quoteToken,
                price: price.dividedBy(EX_DECIMALS).toFixed(FIXP),
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
            console.log(`${side} pair=${pair} price=${or.price} amount=${or.amount} hash=${ret[k].hash} nonce=${ret[k].nonce}`)
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

const match = async (orderBookData) => {
    try {
        let remotePrice = parseFloat(await getLatestPrice(pair))
        let bestPrice = new BigNumber(new BigNumber(remotePrice).toFixed(FIXP)).multipliedBy(TOKEN_DECIMALS)
        let price = new BigNumber(0)
        let amount = new BigNumber(0)
        let side = 'BUY'

        orderBookData.asks.forEach(ask => {
            let p = new BigNumber(ask.pricepoint)
            let a = new BigNumber(ask.amount)
            if (p.isLessThanOrEqualTo(bestPrice) &&
                a.dividedBy(BASE_TOKEN_DECIMALS).multipliedBy(10 ** FIXA).isGreaterThanOrEqualTo(new BigNumber(1))
            ) {
                side = 'BUY'
                price = p
                amount = amount.plus(a)
            }
        })

        orderBookData.bids.forEach(bid => {
            let p = new BigNumber(bid.pricepoint)
            let a = new BigNumber(bid.amount)
            if (p.isGreaterThanOrEqualTo(bestPrice) &&
                a.dividedBy(BASE_TOKEN_DECIMALS).multipliedBy(10 ** FIXA).isGreaterThanOrEqualTo(new BigNumber(1))
            ) {
                side = 'SELL'
                price = p
                amount = amount.plus(a)
            }
        })

        let ROUNDING_MODE = (side === 'SELL') ? 1 : 0

        if (amount.isEqualTo(0)) {
            price = bestPrice.dividedBy(TOKEN_DECIMALS).toFixed(FIXP)
            amount = defaultAmount.toFixed(FIXA)
            await createOrder(price, amount, side)
        } else {
            price = price.dividedBy(TOKEN_DECIMALS).toFixed(FIXP, ROUNDING_MODE)
            amount = amount.dividedBy(BASE_TOKEN_DECIMALS).toFixed(FIXA)

            await createOrder(price, amount, side)
        }


    } catch (err) {
        console.log(err)
    }
}

const run = async (p) => {
    tomox = new TomoX(config.get('relayerUrl'), '', config[p].pkey)
    pair = p || 'BTC-TOMO'
    ORDERBOOK_LENGTH = config[p].orderbookLength || config.get('orderbookLength') || 5
    baseToken = config[p].baseToken
    quoteToken = config[p].quoteToken

    let remotePrice = parseFloat(await getLatestPrice(pair))
    let price = new BigNumber(remotePrice).multipliedBy(EX_DECIMALS)
    minimumPriceStepChange = price.dividedBy(1e3)

    let d = (await tomox.getTokenInfo(quoteToken)).decimals
    TOKEN_DECIMALS = 10 ** parseInt(d || 18)
    d = (await tomox.getTokenInfo(baseToken)).decimals
    BASE_TOKEN_DECIMALS = 10 ** parseInt(d || 18)

    let prec = calcPrecision(remotePrice)
    FIXP = prec.pricePrecision
    FIXA = prec.amountPrecision

    defaultAmount = parseFloat(new BigNumber(config.volume).dividedBy(usdPrice).multipliedBy(EX_DECIMALS).toFixed(FIXA))

    let speed = config[pair].speed || config.speed || 50000
    while(true) {
        await runMarketMaker()
        await sleep(speed)
    }
}

calcPrecision = (price) => {
    const totalPrecision = 8
    let pricePrecision = 4
    let amountPrecision = totalPrecision - pricePrecision
    if (!price) return {pricePrecision: totalPrecision, amountPrecision: totalPrecision}
    switch (true) {
        case (price >= 50):
            pricePrecision = 2
            amountPrecision = totalPrecision - pricePrecision
            break
        case (price >= 1):
            pricePrecision = 4
            amountPrecision = totalPrecision - pricePrecision
            break
        case (price >= 0.1):
            pricePrecision = 5
            amountPrecision = totalPrecision - pricePrecision
            break
        case (price >= 0.001):
            pricePrecision = 6
            amountPrecision = totalPrecision - pricePrecision
            break
        default:
            pricePrecision = 8
            amountPrecision = totalPrecision - pricePrecision
            break
    }
    return { pricePrecision, amountPrecision }
}

module.exports = { run }
