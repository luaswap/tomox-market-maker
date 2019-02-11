const CronJob = require('cron').CronJob

const { fetchOrderBook } = require('./fetchOrderBook')

const runMarketMaker = async () => {
  const orderBookData = await fetchOrderBook()
  console.log(orderBookData)
}

/**
 * Fetch order book
 */
new CronJob('* * * * * *', runMarketMaker, null, true)
