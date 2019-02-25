import { utils } from "ethers"

export const BASE_URL = process.env.BASE_URL
export const WS_BASE_URL = process.env.WS_BASE_URL

export const tokenAddresses = {
  TOMO: '0x0000000000000000000000000000000000000001',
  ETH: process.env.ETH_ADDRESS,
}

export const defaultOrderParams = {
  amount: 1,
  price: 1,
}

export const minimumPriceStepChange = utils.bigNumberify(10).pow(36).div(utils.bigNumberify(1e2)) // 0.01

export const exchangeAddress = '0x0000000000000000000000000000000000000000'

export const coinMarketCapAPI = 'https://pro-api.coinmarketcap.com'
