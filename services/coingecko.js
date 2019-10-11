const axios = require('axios')

const getLatestPrice = async () => {
    try {
        console.log('Fetch data from coingecko')
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=tomochain&vs_currencies=btc`)

        return 1/response.data.tomochain.btc
    } catch (err) {
        console.log(err)
        return null
    }
}
module.exports = { getLatestPrice }
