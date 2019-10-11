import { getOrderBook } from '../services/getOrderBook'
import { getLatestPrice } from "../services/coingecko"
import { calculateBetterBid, calculateBetterAsk, calculateBigNumberAmount, calculateCoinmarketcapPrice } from '../utils/price'
import TomoX from 'tomoxjs'

const tomox = new TomoX(process.env.RELAYER_URL, process.env.MARKET_MAKER_PRIVATE_KEY)
console.log(tomox.coinbase)
const defaultAmount = 1000

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
                price: newBidOrder.price / 10 ** 18,
                amount: newBidOrder.amount / 10 ** 18,
                side: 'BUY'
            })
            console.log(o)
        } else {
            const bestAsk = orderBookData.asks[0]
            let newAskOrder = calculateBetterAsk(bestAsk)
            let o = await tomox.createOrder({
                baseToken: process.env.BTC_ADDRESS,
                quoteToken: process.env.TOMO_ADDRESS,
                price: newAskOrder.price / 10 ** 18,
                amount: newAskOrder.amount / 10 ** 18,
                side: 'SELL'
            })
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
        let amount = calculateBigNumberAmount(defaultAmount/latestPrice).toString() / 10 ** 18
        let price = calculateCoinmarketcapPrice(side === 'BUY' ? latestPrice - 0.25 : latestPrice + 0.25) / 10 ** 18
        let side = 'BUY'
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

const applyLivePrice = async () => {
    try {
        const latestPrice = getLatestPrice()
        let amount = calculateBigNumberAmount(defaultAmount/latestPrice).toString() / 10 ** 18
        let price = calculateCoinmarketcapPrice(latestPrice) / 10 ** 18
        let side = 'BUY'

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
    const oc = await tomox.cancelOrder(hash)
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
                let amount = calculateBigNumberAmount(4 * defaultAmount/latestPrice).toString() / 10 ** 18
                let price = bestBid.pricepoint / 10 ** 18
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
                let amount = calculateBigNumberAmount(4 * defaultAmount/latestPrice).toString() / 10 ** 18
                let price = bestAsk.pricepoint / 10 ** 18
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

/**
 * Fetch order book
 */
runMarketMaker()

