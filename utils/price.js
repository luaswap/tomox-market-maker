import { utils } from 'ethers'

import { defaultOrderParams, minimumPriceStepChange } from '../config'
import { printBigNumberToString } from './print'

export const calculateBetterBid = (currentBestBid) => {
  const amountMultipler = utils.bigNumberify(10).pow(18)

  const defaultOrderAmount = utils.bigNumberify(defaultOrderParams.amount).mul(amountMultipler)

  const newBidOrder = {
    amount: printBigNumberToString(utils.bigNumberify(currentBestBid.amount).gt(defaultOrderAmount) ? defaultOrderAmount : utils.bigNumberify(currentBestBid.amount)),
    price: printBigNumberToString(utils.bigNumberify(currentBestBid.pricepoint).add(minimumPriceStepChange)),
  }

  return newBidOrder
}

export const calculateBetterAsk = (currentBestAsk) => {
  const amountMultipler = utils.bigNumberify(10).pow(18)

  const defaultOrderAmount = utils.bigNumberify(defaultOrderParams.amount).mul(amountMultipler)

  const newAskOrder = {
    amount: printBigNumberToString(utils.bigNumberify(currentBestAsk.amount).gt(defaultOrderAmount) ? defaultOrderAmount : utils.bigNumberify(currentBestAsk.amount)),
    price: printBigNumberToString(utils.bigNumberify(currentBestAsk.pricepoint).sub(minimumPriceStepChange)),
  }

  return newAskOrder
}
