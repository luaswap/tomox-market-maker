const axios = require('axios')
const config = require('config')

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
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${baseName},tomochain&vs_currencies=btc`)
            if (baseSymbol === 'btc') {
                return 1/response.data[quoteName].btc
            } else {
                return (1/response.data[quoteName].btc) * response.data[baseName].btc
            }
        } else {
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${baseName},tomochain&vs_currencies=${quoteSymbol}`)
            return  response.data[baseName][quoteSymbol]
        }
    } catch (err) {
        console.log(err)
        return null
    }
}
module.exports = { getLatestPrice }
