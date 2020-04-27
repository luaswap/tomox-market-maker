const TomoJS = require('tomojs')
const BigNumber = require('bignumber.js')
const config = require('config')

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const run = async (p) => {
    let feeder = config.priceFeeder
    let tomo = await TomoJS.setProvider(feeder.rpc, feeder.pkey)
    let speed = feeder.speed || 50000

    while(true) {
        let price = await tomo.tomox.getCurrentEpochPrice(feeder.collateralToken, feeder.lendingToken) || new BigNumber(10).multipliedBy(1e18).toString(10)
        await tomo.tomox.setCollateralPrice({
            token: feeder.collateralToken,
            lendingToken: feeder.lendingToken,
            price: price
        })
        await sleep(speed)
    }
}

module.exports = { run }
