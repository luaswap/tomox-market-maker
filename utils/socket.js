const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:8080/socket')

ws.on('open', function open() {
  console.log('Websocket connected')
})

ws.on('message', function incoming(data) {
  console.log(data)
})

export default ws
