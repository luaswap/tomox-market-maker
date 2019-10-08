const CronJob = require('cron').CronJob

import { getOrderBook } from '../services/getOrderBook'
import { prepareOrderParams, createOrder, createOrderCancel } from '../services/createOrder'
import { getLatestPrice } from "../services/coingecko"
import { calculateBetterBid, calculateBetterAsk, calculateBigNumberAmount, calculateCoinmarketcapPrice } from '../utils/price'
import { createRawOrderCancel } from '../utils/signer'
import { defaultOrderParams } from '../config'

const runMarketMaker = async () => {
  let hash = false
  let nonce = 0
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
      hash = newBidOrder.hash
      nonce = newBidOrder.nonce


      await createOrder(newBidOrder)
    } else {
      const bestAsk = orderBookData.asks[0]
      let newAskOrder = calculateBetterAsk(bestAsk)
      newAskOrder = await prepareOrderParams(newAskOrder.amount, newAskOrder.price, 'SELL')
      console.log(newAskOrder)
      hash = newAskOrder.hash
      nonce = newAskOrder.nonce

      await createOrder(newAskOrder)
    }

  } catch (err) {
    console.log(err)
  }
  if (Math.floor(Math.random() * 5) == 2 && hash) {
      await cancel(hash, nonce)
  }
  setTimeout(match, 10000);
}

const handleEmptyOrderbook = async (side) => {
  try {
    const latestPrice = await getLatestPrice()
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
  process.exit(0)
}

const applyLivePrice = async () => {
  try {
    const latestPrice = getLatestPrice()
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

const cancel = async (hash, nonce) => {
    console.log('Cancel order', hash)
    const oc = await createRawOrderCancel(hash, nonce)
    console.log(oc)
    await createOrderCancel(oc)
}

const match = async () => {
  try {
    const orderBookData = await getOrderBook()
    if (!orderBookData) {
      process.exit(0)
      return
    }

    if (orderBookData.asks.length > orderBookData.bids.length) {
        if (orderBookData.asks.length > 4) {
          const bestBid = orderBookData.asks[4]
          const latestPrice = await getLatestPrice()
          let newBidOrder = await prepareOrderParams(calculateBigNumberAmount(4 * defaultOrderParams.amount/latestPrice).toString(), bestBid.pricepoint, 'BUY')
          console.log(newBidOrder)

          await createOrder(newBidOrder)

        }
    } else {
        if (orderBookData.bids.length > 4) {
          const bestAsk = orderBookData.bids[4]
          const latestPrice = await getLatestPrice()
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

