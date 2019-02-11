const CronJob = require('cron').CronJob

import { fetchOrderBook } from '../services/fetchOrderBook'
import { prepareOrderParams, createOrder } from '../services/createOrder'
import { calculateBetterBid, calculateBetterAsk } from '../utils/price'

const runMarketMaker = async () => {
  try {
    const orderBookData = await fetchOrderBook()
    const bestBid = orderBookData.bids[0]
    const bestAsk = orderBookData.asks[0]

    let newBidOrder = calculateBetterBid(bestBid)
    let newAskOrder = calculateBetterAsk(bestAsk)

    newBidOrder = await prepareOrderParams(newBidOrder.amount, newBidOrder.price, 'BUY')
    newAskOrder = await prepareOrderParams(newAskOrder.amount, newAskOrder.price, 'SELL')

    // console.log(newBidOrder)
    // console.log(newAskOrder)

    await createOrder(newBidOrder)
    await createOrder(newAskOrder)

  } catch (err) {
    console.log(err)
  }
}

/**
 * Fetch order book
 */
new CronJob(process.env.CRON_VALUE, runMarketMaker, null, true)
