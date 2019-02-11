import { utils } from "ethers"

export const BASE_URL = process.env.BASE_URL

export const tokenAddresses = {
  TOMO: '0x0000000000000000000000000000000000000001',
  ETH: '0x0e11C49B66b3d277b4292d8d86fD620b4342043A',
}

export const defaultOrderParams = {
  amount: 100,
  price: 1
}

export const minimumPriceStepChange = utils.bigNumberify(10).pow(36).div(utils.bigNumberify(1e2)) // 0.01
