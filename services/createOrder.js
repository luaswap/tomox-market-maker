import { exchangeAddress } from '../config'
import { sendToServer } from '../utils/socket'
import { createLocalWalletSigner, createRawOrder } from '../utils/signer'
import { getPair } from './getPair'

export const prepareOrderParams = async (amount, price, side) => {
  const signer = await createLocalWalletSigner()
  const userAddress = await signer.getAddress()
  const pair = await getPair()

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

export const createOrderCancel = async (oc) => {
  try {
    const createOrderCancelMessage = {
      channel: 'orders',
      event: {
        type: 'CANCEL_ORDER',
        hash: oc.hash,
        payload: oc,
      },
    }

    sendToServer(createOrderCancelMessage)

  } catch (err) {
    console.log(err)
    return null
  }
}
