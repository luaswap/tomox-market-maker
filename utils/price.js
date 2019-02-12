import { utils } from 'ethers'

import { defaultOrderParams, minimumPriceStepChange } from '../config'
import { printBigNumberToString } from './print'

export const calculateBigNumberAmount = amount => {
  const amountMultiplier = utils.bigNumberify(10).pow(18)

  return utils.bigNumberify(amount).mul(amountMultiplier)
}

export const calculateCoinmarketcapPrice = price => {
  // Get only 2 decimals from the price
  const roundedPrice = Math.round(price * 1e2)

  const priceMultiplier = utils.bigNumberify(10).pow(34) // Because we multiply by 1e2 above

  return utils.bigNumberify(roundedPrice).mul(priceMultiplier).toString()
}

export const calculateBetterBid = (currentBestBid) => {
  const defaultOrderAmount = calculateBigNumberAmount(defaultOrderParams.amount)

  const newBidOrder = {
    amount: printBigNumberToString(utils.bigNumberify(currentBestBid.amount).gt(defaultOrderAmount) ? defaultOrderAmount : utils.bigNumberify(currentBestBid.amount)),
    price: printBigNumberToString(utils.bigNumberify(currentBestBid.pricepoint).add(minimumPriceStepChange)),
  }

  return newBidOrder
}

export const calculateBetterAsk = (currentBestAsk) => {
  const defaultOrderAmount = calculateBigNumberAmount(defaultOrderParams.amount)

  const newAskOrder = {
    amount: printBigNumberToString(utils.bigNumberify(currentBestAsk.amount).gt(defaultOrderAmount) ? defaultOrderAmount : utils.bigNumberify(currentBestAsk.amount)),
    price: printBigNumberToString(utils.bigNumberify(currentBestAsk.pricepoint).sub(minimumPriceStepChange)),
  }

  return newAskOrder
}
