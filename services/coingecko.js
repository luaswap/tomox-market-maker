import axios from 'axios'

import { coinMarketCapAPI } from "../config"

export const getLatestPrice = async () => {
  try {
    console.log('Fetch data from coingecko')
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=tomochain&vs_currencies=btc`)

    if (response.data.status.error_code !== 0) {
      console.log(response.data.status.error_message)
      return
    }

    return 1/response.data.tomochain.btc
  } catch (err) {
    console.log(err)
    return null
  }
}
