const axios = require('axios')
const config = require('config')

const gPrice = {}
const gUSDPrice = {}

const httpClient = axios.create()
httpClient.defaults.timeout = 2500

const getLatestPrice = async (p = false) => {
    try {
        if (p && (config[p] || {}).price) {
            return config[p].price
        }
        let arr = p.split('-')
        let baseSymbol = arr[0].toLowerCase()
        let quoteSymbol = arr[1].toLowerCase()
        if (quoteSymbol === 'usdt') {
            quoteSymbol = 'usd'
        }

        if (quoteSymbol === 'tomo') {
            let response = await httpClient.get(`https://www.binance.com/api/v3/ticker/price?symbol=TOMOBTC`)
            let tomoPrice = response.data.price

            if (baseSymbol === 'btc') {
                gPrice[p] = 1/tomoPrice
            } else {
                response = await httpClient.get(`https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol.toUpperCase()}BTC`)
                let tokenPrice = response.data.price

                gPrice[p] = (1/tomoPrice) * tokenPrice
            }
            return gPrice[p]
        }

        if ( quoteSymbol === 'usd' ) {
            const response = await httpClient.get(`https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol.toUpperCase()}USDT`)
            gPrice[p] = response.data.price

        } else {
            const response = await httpClient.get(
                `https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol.toUpperCase()}${quoteSymbol.toUpperCase()}`
            )
            gPrice[p] = response.data.price
        }
    } catch (err) {
        console.log(err)
    }
    return gPrice[p]
}

const getUSDPrice = async (p = false) => {
    let baseSymbol = 'TOMO'
    try {
        if (p && (config[p] || {}).price) {
            return config[p].price
        }

        let arr = p.split('-')
        baseSymbol = arr[0].toUpperCase()

        if (baseSymbol != 'USDT' && baseSymbol != 'USD') {
            response = await httpClient.get(`https://www.binance.com/api/v3/ticker/price?symbol=${baseSymbol}USDT`)
            let tokenPrice = response.data.price

            gUSDPrice[baseSymbol] = tokenPrice
        } else {
            gUSDPrice[baseSymbol] = 1
        }
    } catch (err) {
        console.log(err)
    }
    return gUSDPrice[baseSymbol]
}

module.exports = { getLatestPrice, getUSDPrice }
