const CronJob = require('cron').CronJob

import { fetchOrderBook } from './fetchOrderBook'
import { calculateBetterBid, calculateBetterAsk } from '../utils/price'

const runMarketMaker = async () => {
  try {
    const orderBookData = await fetchOrderBook()
    const bestBid = orderBookData.bids[0]
    const bestAsk = orderBookData.asks[0]

    const newBidOrder = calculateBetterBid(bestBid)
    const newAskOrder = calculateBetterAsk(bestAsk)

    console.log(newBidOrder)
    console.log(newAskOrder)
  } catch (err) {
    console.log(err)
  }
}

/**
 * Fetch order book
 */
new CronJob('* * * * * *', runMarketMaker, null, true)
