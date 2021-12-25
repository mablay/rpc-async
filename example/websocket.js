// ws is a nodejs websocket implementation and not part of this module
// run `npm i ws` to install it.
import { WebSocketServer, WebSocket } from 'ws'
import { Rpc } from '../index.js'

// SERVER
const wss = new WebSocketServer({ port: 8080 })
wss.on('connection', async function connection(alice) {
  const aliceRpc = Rpc.fromSocketJSON(alice)
  aliceRpc.handle('add', ([a, b]) => a + b)
  aliceRpc.handle('exit', () => {
    console.log('Alice | received "exit" notification')
    aliceRpc.close()
    wss.close()
  })
})

// CLIENT
const clair = new WebSocket('ws://localhost:8080')
const clairRpc = Rpc.fromSocketJSON(clair)
clair.on('open', async () => {
  const res = await clairRpc.request('add', [3, 5])
  console.log('Clair | request add 3 + 5 =>', res)
  await clairRpc.notify('exit')
  
  clairRpc.close()
  clair.close()
  wss.close()  
})
