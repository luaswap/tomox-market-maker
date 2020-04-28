const TomoJS = require('tomojs')
const BigNumber = require('bignumber.js')
const config = require('config')

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const run = async (p) => {
    let feeder = config.priceFeeder
    let tomo = await TomoJS.setProvider(feeder.rpc, feeder.pkey)
    let speed = feeder.speed || 50000

    while(true) {
        let price 
        let p = await tomo.tomox.getCurrentEpochPrice(feeder.collateralToken, feeder.lendingToken)
        let lendingToken = (await tomo.tomoz.getTokenInformation(feeder.lendingToken))
        let lendingDecimals = lendingToken.decimals
        let collateralToken = (await tomo.tomoz.getTokenInformation(feeder.collateralToken))
        let collateralDecimals = collateralToken.decimals

        if (!p) {
            p = await tomo.tomox.getCurrentEpochPrice(feeder.lendingToken, feeder.collateralToken)
            price = new BigNumber(10 ** lendingDecimals).multipliedBy(10** collateralDecimals).dividedBy(new BigNumber(p))
        } else {
            price = new BigNumber(p)
        }

        let b = Math.random() >= 0.5
        
        price = b ? price.multipliedBy(2) : price.dividedBy(2)

        price = price.toFixed(0).toString(10)
        await tomo.tomox.setCollateralPrice({
            token: feeder.collateralToken,
            lendingToken: feeder.lendingToken,
            price: price
        })


        let blockNumber = await tomo.tomo.getBlockNumber()
        let epoch = Math.floor(blockNumber / 900) + 1
        console.log(`${collateralToken.symbol}/${lendingToken.symbol} price ${price} block ${blockNumber} epoch ${epoch}`)

        await sleep(speed)
    }
}

module.exports = { run }
