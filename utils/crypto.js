import { utils } from 'ethers'
import { randInt } from './helpers'
import axios from 'axios'

export const getOrderHash = order => {
  return utils.solidityKeccak256(
    [
      'bytes',
      'bytes',
      'bytes',
      'bytes',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
      'uint256',
    ],
    [
      order.exchangeAddress,
      order.userAddress,
      order.baseToken,
      order.quoteToken,
      order.amount,
      order.pricepoint,
      order.side === 'BUY' ? '0' : '1',
      order.nonce,
      order.makeFee,
      order.takeFee,
    ],
  )
}

export const getNonce = async () => {
  let nonce = 0
  try {
      const response = await axios.get(`${process.env.BASE_URL}/orders/count?address=${process.env.MARKET_MAKER_ADDRESS}`)
      // nonce = response.data.data ? String(response.data.data + 1) : '0'
      console.log(response.data)
      nonce = response.data.data + 1
  } catch (e) {
      console.log(e)
      nonce = 0
  }

  return String(nonce)
}
