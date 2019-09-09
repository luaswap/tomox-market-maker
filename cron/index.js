const CronJob = require('cron').CronJob

import { getOrderBook } from '../services/getOrderBook'
import { prepareOrderParams, createOrder } from '../services/createOrder'
import { getMarketQuotes } from "../services/coinmarketcap/getMarketQuotes"
import { calculateBetterBid, calculateBetterAsk, calculateBigNumberAmount, calculateCoinmarketcapPrice } from '../utils/price'
import { defaultOrderParams } from '../config'

const runMarketMaker = async () => {
  try {
    const orderBookData = await getOrderBook()
    if (!orderBookData) {
      return
    }

    if (orderBookData.bids.length === 0) {
      return await handleEmptyOrderbook('BUY')
    }

    if (orderBookData.asks.length === 0) {
      return await handleEmptyOrderbook('SELL')
    }

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
  setTimeout(match, 10000);
}

const handleEmptyOrderbook = async (side) => {
  try {
    const marketQuote = await getMarketQuotes()
    const latestPrice = marketQuote['BTC'].quote['TOMO'].price
    const newOrder = await prepareOrderParams(
      calculateBigNumberAmount(defaultOrderParams.amount/latestPrice).toString(),
      calculateCoinmarketcapPrice(side === 'BUY' ? latestPrice - 0.25 : latestPrice + 0.25),
      side
    )
    console.log(newOrder)

    await createOrder(newOrder)
  } catch (err) {
    console.log(err)
  }
}

const applyLivePrice = async () => {
  try {
    const marketQuote = await getMarketQuotes()
    const latestPrice = marketQuote['BTC'].quote['TOMO'].price
    const newBidOrder = await prepareOrderParams(
      calculateBigNumberAmount(defaultOrderParams.amount/latestPrice).toString(),
      calculateCoinmarketcapPrice(latestPrice),
      'BUY'
    )
    console.log(newBidOrder)

    await createOrder(newBidOrder)
  } catch (err) {
    console.log(err)
  }
  process.exit(0)
}

const match = async () => {
  try {
    const orderBookData = await getOrderBook()
    const marketQuote = await getMarketQuotes()

    if (orderBookData.asks.length > orderBookData.bids.length) {
        if (orderBookData.asks.length > 4) {
          const bestBid = orderBookData.asks[4]
          const latestPrice = marketQuote['BTC'].quote['TOMO'].price
          let newBidOrder = await prepareOrderParams(calculateBigNumberAmount(4 * defaultOrderParams.amount/latestPrice).toString(), bestBid.pricepoint, 'BUY')
          console.log(newBidOrder)

          await createOrder(newBidOrder)

        }
    } else {
        if (orderBookData.bids.length > 4) {
          const bestAsk = orderBookData.bids[4]
          const latestPrice = marketQuote['BTC'].quote['TOMO'].price
          let newAskOrder = await prepareOrderParams(calculateBigNumberAmount(4 * defaultOrderParams.amount/latestPrice).toString() , bestAsk.pricepoint, 'SELL')
          console.log(newAskOrder)

          await createOrder(newAskOrder)
        }
    }

  } catch (err) {
    console.log(err)
  }
  process.exit(0)
}

/**
 * Fetch order book
 */
// new CronJob(process.env.CRON_VALUE, runMarketMaker, null, true)
runMarketMaker()

/**
 * Periodically (10 minutes) get real time price from coinmarketcap.com and create order
 */
// new CronJob(process.env.CRON_FETCH_LIVE_PRICE, applyLivePrice, null, true)
// applyLivePrice()
