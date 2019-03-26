const CronJob = require('cron').CronJob

import { prepareOrderParams, createOrder } from '../services/createOrder'

const runMarketMaker = async () => {
  console.log('runMarketMaker')
  try {
    let newOrder = await prepareOrderParams()
    console.log(newOrder)

    await createOrder(newOrder)

  } catch (err) {
    console.log(err)
  }
}

/**
 * Fetch order book
 */
new CronJob(process.env.CRON_VALUE, runMarketMaker, null, true)
