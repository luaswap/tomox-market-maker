import { BASE_URL, tokenAddresses, exchangeAddress } from '../config'
import { sendToServer } from '../utils/socket'
import { createLocalWalletSigner, createRawOrder } from '../utils/signer'
import { fetchPair } from '../services/fetchPair'

export const prepareOrderParams = async (amount, price, side) => {
  const signer = await createLocalWalletSigner()
  const userAddress = await signer.getAddress()
  const pair = await fetchPair()

  const {
    makeFee,
    takeFee,
  } = pair

  const params = {
    side,
    exchangeAddress,
    userAddress,
    pair,
    amount,
    price,
    makeFee,
    takeFee,
  }

  const order = await createRawOrder(params)
  // console.log(order)

  return order
}

export const createOrder = async (order, baseToken = null, quoteToken = null) => {
  try {
    const createOrderMessage = {
      channel: 'orders',
      event: {
        type: 'NEW_ORDER',
        hash: order.hash,
        payload: order,
      },
    }

    sendToServer(createOrderMessage)

  } catch (err) {
    console.log(err)
    return null
  }
}
