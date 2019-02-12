const CronJob = require('cron').CronJob

import { fetchOrderBook } from '../services/fetchOrderBook'
import { prepareOrderParams, createOrder } from '../services/createOrder'
import { calculateBetterBid, calculateBetterAsk } from '../utils/price'

const runMarketMaker = async () => {
  try {
    const orderBookData = await fetchOrderBook()

    if (orderBookData.bids.length <= orderBookData.asks.length) {
      const bestBid = orderBookData.bids[0]
      let newBidOrder = calculateBetterBid(bestBid)
      newBidOrder = await prepareOrderParams(newBidOrder.amount, newBidOrder.price, 'BUY')
      console.log(newBidOrder)

      await createOrder(newBidOrder)
    } else {
      const bestAsk = orderBookData.asks[0]
      let newAskOrder = calculateBetterAsk(bestAsk)
      newAskOrder = await prepareOrderParams(newAskOrder.amount, newAskOrder.price, 'SELL')
      console.log(newAskOrder)

      await createOrder(newAskOrder)
    }

  } catch (err) {
    console.log(err)
  }
}

/**
 * Fetch order book
 */
new CronJob(process.env.CRON_VALUE, runMarketMaker, null, true)
