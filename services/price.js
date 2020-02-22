const axios = require('axios')
const config = require('config')

const gPrice = {}

const getLatestPrice = async (p = false) => {
    try {
        if (p && (config[p] || {}).price) {
            return config[p].price
        }
        let baseName = config[p].baseName
        let quoteName = config[p].quoteName
        let arr = p.split('-')
        let baseSymbol = arr[0].toLowerCase()
        let quoteSymbol = arr[1].toLowerCase()
        if (quoteSymbol === 'usdt') {
            quoteSymbol = 'usd'
        }

        if (quoteSymbol === 'tomo') {
            let response = await axios.get(`https://www.binance.com/api/v3/ticker/price?symbol=TOMOBTC`)
            let tomoPrice = response.data.price

            if (baseSymbol === 'btc') {
                gPrice[p] = 1/tomoPrice
            } else {
                response = await axios.get(`https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol.toUpperCase()}BTC`)
                let tokenPrice = response.data.price

                gPrice[p] = (1/tomoPrice) * tokenPrice
            }
        }

        if ( quoteSymbol === 'usd' ) {
            const response = await axios.get(`https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol.toUpperCase()}USDT`)
            gPrice[p] = response.data.price

        } else {
            const response = await axios.get(`https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol.toUpperCase()}${quoteSymbol.toUpperCase()}`)
            gPrice[p] = response.data.price
        }
    } catch (err) {
        console.log(err)
    }
    return gPrice[p]
}
module.exports = { getLatestPrice }
