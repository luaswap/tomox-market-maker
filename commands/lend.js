const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')
const { getUSDPrice } = require('../services/price')

let lendingToken = ''
let term = ''
let pair = 'USD-60'
let tomox = new TomoX()

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
        let tomoPrice = parseFloat(await getUSDPrice('TOMO-USD'))
        let side = (Math.floor(Math.random() * 10) % 2 === 0) ? 'BORROW' : 'INVEST'
        let interest = ((10 * tomoPrice) + 6.00).toFixed(2)
        let quantity = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000

        let o = await createOrder(side, interest, quantity)

    } catch (err) {
        console.log(err)
    }
}

const run = async (p) => {
    tomox = new TomoX(config.get('relayerUrl'), '', config[p].pkey)
    pair = p || 'USD-60'

    let speed = config[pair].speed || config.speed || 50000
    while(true) {
        await runMarketMaker()
        await sleep(speed)
    }
}

module.exports = { run }
