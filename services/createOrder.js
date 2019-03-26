import axios from 'axios'

import { exchangeAddress } from '../config'
import { createLocalWalletSigner, createRawOrder } from '../utils/signer'
import { getPair } from './getPair'

export const prepareOrderParams = async () => {
  const signer = await createLocalWalletSigner()
  const userAddress = await signer.getAddress()
  const pair = await getPair()

  const side = 'BUY'
  const amount = 10
  const price = 250

  const params = {
    side,
    exchangeAddress,
    userAddress,
    pair,
    amount,
    price,
  }

  const order = await createRawOrder(params)
  // console.log(order)

  return order
}

export const createOrder = async (order) => {
  try {
    let params = {}
    params.topic = ''
    params.payload = order

    return axios.post(process.env.TOMOCHAIN_NODE_HTTP_URL, {
      jsonrpc: '2.0',
      id: +new Date(),
      method: 'tomoX_createOrder',
      params: JSON.stringify(params),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.log(err)
    return null
  }
}
