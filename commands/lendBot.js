const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')
const { getUSDPrice } = require('../services/price')

let lendingToken = ''
let term = ''
let pair = 'USD-60'
let defaultAmount = 1
let FIXA = 2 // amount decimals
let FIXI = 2 // interest decimals
let tomox = new TomoX()
let lendOrderBookLength = 5
let defaultInterest = 7
let defaultStep = 0.01

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const createOrder = async (side, interest, quantity) => {
    let o = await tomox.createLending({
        collateralToken: config[pair].collateralToken,
        lendingToken: config[pair].lendingToken,
        quantity: String(quantity),
        interest: String(interest),
        term: String(config[pair].term),
        side: side
    })

    console.log(`${side} pair=${pair} rate=${interest} amount=${quantity} hash=${o.hash} nonce=${o.nonce}`)
    return o
}

const runMarketMaker = async () => {
    try {
        const orderBookData = await tomox.getLendingOrderBook({
            term: config[pair].term, lendingToken: config[pair].lendingToken
        })
        if (orderBookData.borrow.length < lendOrderBookLength) {
            let length = orderBookData.borrow.length
            let side = 'BORROW' 
            let interest = (defaultInterest - (defaultStep * (length + 1) * (1 + Math.random()))).toFixed(FIXI)
            let quantity = (defaultAmount * (1 + Math.random())).toFixed(FIXA)

            let o = await createOrder(side, interest, quantity)
            return o
        }

        if (orderBookData.lend.length < lendOrderBookLength) {
            let length = orderBookData.lend.length
            let side = 'INVEST' 
            let interest = (defaultInterest + (defaultStep * (length + 1) * (1 + Math.random()))).toFixed(FIXI)
            let quantity = (defaultAmount * (1 + Math.random())).toFixed(FIXA)

            let o = await createOrder(side, interest, quantity)
            return o
        }


        let side = (Math.floor(Math.random() * 10) % 2 === 0) ? 'BORROW' : 'INVEST'
        if (orderBookData.borrow[0].interest === (new BigNumber(defaultInterest)).multipliedBy(1e8).toString(10)) {
            side = 'INVEST'
        }

        if (orderBookData.lend[0].interest === (new BigNumber(defaultInterest)).multipliedBy(1e8).toString(10)) {
            side = 'BORROW'
        }

        let interest = defaultInterest
        let quantity = (defaultAmount * (1 + Math.random())).toFixed(FIXA)

        let o = await createOrder(side, interest, quantity)
        return o

    } catch (err) {
        console.log(err)
    }
}

const run = async (p) => {
    let usdPrice = parseFloat(await getUSDPrice(p))
    let lendingVolume = config[pair].lendingVolume || config.lendingVolume
    defaultAmount = parseFloat(new BigNumber(lendingVolume).dividedBy(usdPrice).toFixed(FIXA))
    tomox = new TomoX(config.get('relayerUrl'), '', config[p].pkey)
    pair = p || 'USD-60'

    let speed = config[pair].speed || config.speed || 50000
    lendOrderBookLength = config[pair].lendOrderBookLength || config.lendOrderBookLength || lendOrderBookLength
    defaultInterest = config[pair].interest || config.interest || defaultInterest
    defaultStep = config[pair].lendStep || config.lendStep || defaultInterest

    while(true) {
        await runMarketMaker()
        await sleep(speed)
    }
}

module.exports = { run }
