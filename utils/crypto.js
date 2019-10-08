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
      'string',
      'string',
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
      order.status,
      order.type,
      order.nonce,
    ],
  )
}

export const getNonce = async () => {
  let nonce = 0
  try {
      const response = await axios.get(`${process.env.BASE_URL}/orders/nonce?address=${process.env.MARKET_MAKER_ADDRESS}`)
      console.log(response.data)
      nonce = String(response.data.data)
  } catch (e) {
      console.log(e)
      nonce = 0
  }

  return String(nonce)
}
