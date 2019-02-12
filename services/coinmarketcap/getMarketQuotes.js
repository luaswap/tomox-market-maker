import axios from 'axios'

import { coinMarketCapAPI } from "../../config"

export const getMarketQuotes = async (baseTokenSymbol = null, quoteTokenSymbol = null) => {
  try {
    baseTokenSymbol = baseTokenSymbol || 'ETH'
    quoteTokenSymbol = quoteTokenSymbol || 'TOMO'

    const response = await axios.get(`${coinMarketCapAPI}/v1/cryptocurrency/quotes/latest?symbol=${baseTokenSymbol}&convert=${quoteTokenSymbol}`, {
      headers: { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY },
    })

    return response.data.data
  } catch (err) {
    console.log(err)
    return null
  }
}
