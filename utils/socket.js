const WebSocket = require('ws')

import { WS_BASE_URL } from '../config'

const ws = new WebSocket(WS_BASE_URL)

ws.on('open', function open() {
  console.log('Connected to Websocket')
})

export const sendToServer = (message) => {
  ws.send(JSON.stringify(message))
}
