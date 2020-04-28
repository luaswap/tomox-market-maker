const { getLatestPrice, getUSDPrice } = require('../services/price')
const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')
const { calcPrecision } = require('../utils')

let FIXA = 5 // amount decimals
let FIXP = 7 // price decimals
let tomox = new TomoX()
let pair = 'TOMO-BTC'
let baseToken = config.get(`${pair}.baseToken`)
let quoteToken = config.get(`${pair}.quoteToken`)
let EX_DECIMALS = 1e8

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

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


const run = async (p) => {
    tomox = new TomoX(config.get('relayerUrl'), '', config.wallPKey)
    pair = p || 'BTC-TOMO'
    baseToken = config[p].baseToken
    quoteToken = config[p].quoteToken
    let speed = config[pair].speed || config.speed || 50000
    let ORDERBOOK_LENGTH = config[p].orderbookLength || config.get('orderbookLength') || 5

    let hash 
    let first = true
    while(true) {

        if (hash) {
            console.log('CANCEL', `orderHash=${hash}`)
            await tomox.cancelOrder(hash)
            hash = null
            await sleep(5000)
        }

        let remotePrice = parseFloat(await getLatestPrice(pair))
        let price = new BigNumber(remotePrice).multipliedBy(EX_DECIMALS)
        let usdPrice = parseFloat(await getUSDPrice(pair))

        let prec = calcPrecision(remotePrice)
        FIXP = prec.pricePrecision
        FIXA = prec.amountPrecision

        let amount = parseFloat(new BigNumber(config.volume)
            .dividedBy(usdPrice).multipliedBy(ORDERBOOK_LENGTH * 60 * 60 * 1000 / speed).toFixed(FIXA))
        let ran = Math.floor(Math.random() * 3)

        if (first === true || ran !== 0) {
            first = false
            let b = Math.random() >= 0.5
            let side = b ? 'BUY' : 'SELL'

            price = b ? price.multipliedBy(2) : price.dividedBy(2)
            price = price.dividedBy(EX_DECIMALS).toString(10)

            let o = await createOrder(price, amount, side)
            hash = o.hash
        } else {
            console.log('SLEEP 1 hour')
        }
        await sleep(60 * 60 * 1000)
    }
}

module.exports = { run }
