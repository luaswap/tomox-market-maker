const CronJob = require('cron').CronJob

const { fetchOrderBook } = require('./fetchOrderBook')

/**
 * Fetch order book
 */
new CronJob('* * * * * *', fetchOrderBook, null, true)
