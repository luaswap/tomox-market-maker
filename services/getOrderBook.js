import axios from 'axios'

import { BASE_URL, tokenAddresses } from '../config'

export const getOrderBook = async (baseToken = null, quoteToken = null) => {
  try {
    baseToken = baseToken || tokenAddresses.BTC
    quoteToken = quoteToken || tokenAddresses.TOMO

    const response = await axios.get(`${BASE_URL}/orderbook?baseToken=${baseToken}&quoteToken=${quoteToken}`)

    return response.data.data
  } catch (err) {
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(err.response.data)
      console.log(err.response.status)
      console.log(err.response.headers)
    } else if (err.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log(err.request)
      console.log('getOrderBook was made but no response was received')
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', err.message)
    }

    return null
  }
}
