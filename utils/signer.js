import { utils, Wallet } from 'ethers'

import { computePricepoint, computeAmountPoints } from './helpers'
import { getOrderHash, getRandomNonce } from './crypto'
import { createWalletFromPrivateKey, createProvider } from "./wallet"

export const createLocalWalletSigner = async () => {
  const wallet = createWalletFromPrivateKey(process.env.MARKET_MAKER_PRIVATE_KEY)
  const provider = createProvider()
  const signer = new Wallet(wallet.privateKey, provider)

  return signer
}

// The amountPrecisionMultiplier and pricePrecisionMultiplier are temporary multipliers
// that are used to turn decimal values into rounded integers that can be converted into
// big numbers that can be used to compute large amounts (ex: in wei) with the amountMultiplier
// and priceMultiplier. After multiplying with amountMultiplier and priceMultiplier, the result
// numbers are divided by the precision multipliers.
// So in the end we have:
// amountPoints ~ amount * amountMultiplier ~ amount * 1e18
// pricePoints ~ price * priceMultiplier ~ price * 1e6
export const createRawOrder = async (params) => {
  try {
    const order = {}
    const { userAddress, exchangeAddress, side, pair, amount, price, makeFee, takeFee } = params
    const { baseTokenAddress, quoteTokenAddress, baseTokenDecimals, quoteTokenDecimals } = pair


    const precisionMultiplier = utils.bigNumberify(10).pow(9)
    const priceMultiplier = utils.bigNumberify(10).pow(18)
    const baseMultiplier = utils.bigNumberify(10).pow(baseTokenDecimals)
    const quoteMultiplier = utils.bigNumberify(10).pow(quoteTokenDecimals)
    const pricepoint = computePricepoint({ price, priceMultiplier, quoteMultiplier, precisionMultiplier })
    const amountPoints = computeAmountPoints({ amount, baseMultiplier, precisionMultiplier })

    order.exchangeAddress = exchangeAddress
    order.userAddress = userAddress
    order.baseToken = baseTokenAddress
    order.quoteToken = quoteTokenAddress
    order.amount = amountPoints.toString()
    order.pricepoint = pricepoint.toString()
    order.side = side
    order.makeFee = makeFee
    order.takeFee = takeFee
    order.nonce = getRandomNonce()
    order.hash = getOrderHash(order)

    const signature = await this.signMessage(utils.arrayify(order.hash))
    const { r, s, v } = utils.splitSignature(signature)

    order.signature = { R: r, S: s, V: v }
    return order
  } catch (err) {
    console.log(err)
  }
}
