const axios = require('axios')
const config = require('config')

const getLatestPrice = async (p = false) => {
    try {
        if (p && (config[p] || {}).price) {
            return config[p].price
        }
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum-classic,ethereum,tomochain,bitcoin,litecoin,binancecoin,cardano,ripple,bitcoin-cash,eos,tomochain&vs_currencies=btc`)
        switch(p) {
            case 'BTCTOMO':
                return 1/response.data.tomochain.btc
            case 'ETHTOMO':
                return (1/response.data.tomochain.btc) * response.data.ethereum.btc
            case 'EOSTOMO':
                return (1/response.data.tomochain.btc) * response.data.eos.btc
            case 'XRPTOMO':
                return (1/response.data.tomochain.btc) * response.data.ripple.btc
            case 'BNBTOMO':
                return (1/response.data.tomochain.btc) * response.data.binancecoin.btc
            case 'BCHTOMO':
                return (1/response.data.tomochain.btc) * response.data['bitcoin-cash'].btc
            case 'LTCTOMO':
                return (1/response.data.tomochain.btc) * response.data.litecoin.btc
            case 'ADATOMO':
                return (1/response.data.tomochain.btc) * response.data.cardano.btc
            case 'ETCTOMO':
                return (1/response.data.tomochain.btc) * response.data['ethereum-classic'].btc
            case 'ETHBTC':
                return response.data.ethereum.btc
            case 'XRPBTC':
                return response.data.ripple.btc
            default:
                return 1/response.data.tomochain.btc
        }
    } catch (err) {
        console.log(err)
        return null
    }
}
module.exports = { getLatestPrice }
