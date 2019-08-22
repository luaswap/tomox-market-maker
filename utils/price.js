import { utils } from 'ethers'
import BigNumber from "bignumber.js"

BigNumber.set({ ROUNDING_MODE: 0 })

import { defaultOrderParams, minimumPriceStepChange } from '../config'
import { printBigNumberToString } from './print'
import { randInt } from "./helpers"

export const calculateBigNumberAmount = amount => {
  return (new BigNumber(amount)).multipliedBy(1e+18).toFixed(0) 
}

export const calculateCoinmarketcapPrice = price => {
  // Get only 2 decimals from the price
  const roundedPrice = Math.round(price * 1e2)

  const priceMultiplier = utils.bigNumberify(10).pow(16) // Because we multiply by 1e2 above

  return utils.bigNumberify(roundedPrice).mul(priceMultiplier).toString()
}

export const calculateBetterBid = (currentBestBid) => {
  const defaultOrderAmount = calculateBigNumberAmount(defaultOrderParams.amount/(currentBestBid.pricepoint/1e+18))

  const newBidOrder = {
    amount: printBigNumberToString(defaultOrderAmount),
    price: printBigNumberToString(utils.bigNumberify(currentBestBid.pricepoint).add(minimumPriceStepChange)),
  }

  return newBidOrder
}

export const calculateBetterAsk = (currentBestAsk) => {
  const defaultOrderAmount = calculateBigNumberAmount(defaultOrderParams.amount/(currentBestAsk.pricepoint/1e+18))

  const newAskOrder = {
    amount: printBigNumberToString(defaultOrderAmount),
    price: printBigNumberToString(utils.bigNumberify(currentBestAsk.pricepoint).sub(minimumPriceStepChange)),
  }

  return newAskOrder
}
