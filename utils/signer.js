import { utils, Wallet } from 'ethers'

import { computePricepoint, computeAmountPoints } from './helpers'
import { getOrderHash, getNonce, getOrderCancelHash } from './crypto'
import { createWalletFromPrivateKey, createProvider } from "./wallet"

let signer

export const createLocalWalletSigner = async () => {
  const wallet = createWalletFromPrivateKey(process.env.MARKET_MAKER_PRIVATE_KEY)
  const provider = createProvider()
  signer = new Wallet(wallet.privateKey, provider)

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
    const { userAddress, exchangeAddress, side, pair, amount, price } = params
    const { baseTokenAddress, quoteTokenAddress, baseTokenDecimals, quoteTokenDecimals } = pair


    const precisionMultiplier = utils.bigNumberify(10).pow(9)
    const priceMultiplier = utils.bigNumberify(10).pow(18)
    const baseMultiplier = utils.bigNumberify(10).pow(baseTokenDecimals)
    const quoteMultiplier = utils.bigNumberify(10).pow(quoteTokenDecimals)
    // const pricepoint = computePricepoint({ price, priceMultiplier, quoteMultiplier, precisionMultiplier })
    // const amountPoints = computeAmountPoints({ amount, baseMultiplier, precisionMultiplier })

    order.exchangeAddress = exchangeAddress
    order.userAddress = userAddress
    order.baseToken = baseTokenAddress
    order.quoteToken = quoteTokenAddress
    order.amount = amount
    order.pricepoint = price
    order.side = side
    order.type = 'LO'
    order.status = 'NEW'
    order.nonce = await getNonce()
    order.hash = getOrderHash(order)

    const signature = await signer.signMessage(utils.arrayify(order.hash))
    const { r, s, v } = utils.splitSignature(signature)

    order.signature = { R: r, S: s, V: v }
    return order
  } catch (err) {
    console.log(err)
  }
}

export const createRawOrderCancel = async (hash, nonce) => {
  try {
    const oc = {}
    oc.orderHash = hash
    oc.nonce = String(parseInt(nonce) + 1)
    oc.hash = getOrderCancelHash(oc)

    const signature = await signer.signMessage(utils.arrayify(oc.hash))
    const { r, s, v } = utils.splitSignature(signature)

    oc.signature = { R: r, S: s, V: v }
    return oc
  } catch (err) {
    console.log(err)
  }
}
