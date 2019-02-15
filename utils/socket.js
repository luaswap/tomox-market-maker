const WebSocket = require('ws')

import { WS_BASE_URL } from '../config'

const ws = new WebSocket(WS_BASE_URL)

ws.on('open', function open() {
  console.log('Connected to Websocket')
})

ws.on('error', (err) => {
  console.log('Connection error')
  console.log(err)
})

export const sendToServer = (message) => {
  try {
    ws.send(JSON.stringify(message), function ack(err) {
      if (err) {
        console.log(err)
      }
    })
  } catch (err) {
    console.log(err)
  }
}
