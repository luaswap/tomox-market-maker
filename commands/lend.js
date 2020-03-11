const TomoX = require('tomoxjs')
const BigNumber = require('bignumber.js')
const config = require('config')

let lendingToken = ''
let term = ''
let pair = 'USD-60'

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const runMarketMaker = async () => {
    try {
        const orderBookData = await tomox.getLendingOrderBook({
            term: config[pair].term, lendingToken: config[pair].lendingToken
        })
        console.log(orderBookData)

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
