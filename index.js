import { getOrderBook } from './services/getOrderBook'
import { getLatestPrice } from "./services/coingecko"
require('dotenv').config()
import TomoX from 'tomoxjs'
import BigNumber from "bignumber.js"

const tomox = new TomoX(process.env.RELAYER_URL, process.env.MARKET_MAKER_PRIVATE_KEY)
const defaultAmount = 1000 // TOMO
const minimumPriceStepChange = 0.01

const runMarketMaker = async () => {
    let hash = false
    let nonce = 0
    try {
        const orderBookData = await getOrderBook(process.env.BTC_ADDRESS, process.env.TOMO_ADDRESS)
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
            let o = await tomox.createOrder({
                baseToken: process.env.BTC_ADDRESS,
                quoteToken: process.env.TOMO_ADDRESS,
                price: newBidOrder.price,
                amount: newBidOrder.amount,
                side: 'BUY'
            })
            hash = o.hash
            nonce = parseInt(o.nonce) + 1
            console.log(o)
        } else {
            const bestAsk = orderBookData.asks[0]
            let newAskOrder = calculateBetterAsk(bestAsk)
            let o = await tomox.createOrder({
                baseToken: process.env.BTC_ADDRESS,
                quoteToken: process.env.TOMO_ADDRESS,
                price: newAskOrder.price,
                amount: newAskOrder.amount,
                side: 'SELL'
            })
            hash = o.hash
            nonce = parseInt(o.nonce) + 1
            console.log(o)
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
        let amount = (defaultAmount/latestPrice).toString()
        let price = side === 'BUY' ? latestPrice - 0.1 * latestPrice : latestPrice + 0.1 * latestPrice
        let o = await tomox.createOrder({
            baseToken: process.env.BTC_ADDRESS,
            quoteToken: process.env.TOMO_ADDRESS,
            price: price,
            amount: amount,
            side: side
        })
        console.log(o)
    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}

const cancel = async (hash, nonce) => {
    console.log('Cancel order', hash)
    const oc = await tomox.cancelOrder(hash, nonce)
    console.log(oc)
}

const match = async () => {
    try {
        const orderBookData = await getOrderBook(process.env.BTC_ADDRESS, process.env.TOMO_ADDRESS)
        if (!orderBookData) {
            process.exit(0)
            return
        }

        if (orderBookData.asks.length > orderBookData.bids.length) {
            if (orderBookData.asks.length > 4) {
                const bestBid = orderBookData.asks[4]
                const latestPrice = await getLatestPrice()
                let amount = (4 * defaultAmount/latestPrice).toString()
                let price = bestBid.pricepoint
                let side = 'BUY'
                let o = await tomox.createOrder({
                    baseToken: process.env.BTC_ADDRESS,
                    quoteToken: process.env.TOMO_ADDRESS,
                    price: price,
                    amount: amount,
                    side: side
                })
                console.log(o)

            }
        } else {
            if (orderBookData.bids.length > 4) {
                const bestAsk = orderBookData.bids[4]
                const latestPrice = await getLatestPrice()
                let amount = (4 * defaultAmount/latestPrice).toString()
                let price = bestAsk.pricepoint
                let side = 'SELL'

                // await createOrder(newAskOrder)
                let o = await tomox.createOrder({
                    baseToken: process.env.BTC_ADDRESS,
                    quoteToken: process.env.TOMO_ADDRESS,
                    price: price,
                    amount: amount,
                    side: side
                })
                console.log(o)
            }
        }

    } catch (err) {
        console.log(err)
    }
    process.exit(0)
}


const calculateBetterBid = (currentBestBid) => {
  const newBidOrder = {
    amount: defaultAmount/(currentBestBid.pricepoint/1e+18),
    price: (new BigNumber(currentBestBid.pricepoint/1e+18).plus(minimumPriceStepChange)).toString()
  }

  return newBidOrder
}

const calculateBetterAsk = (currentBestAsk) => {
  const newAskOrder = {
    amount: defaultAmount/(currentBestAsk.pricepoint/1e+18),
    price: (new BigNumber(currentBestAsk.pricepoint/1e+18).sub(minimumPriceStepChange)).toString()
  }

  return newAskOrder
}

/**
 * Fetch order book
 */
runMarketMaker()

