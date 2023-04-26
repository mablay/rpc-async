// ws is a nodejs websocket implementation and not part of this module
// run `npm i ws` to install it.
import { WebSocketServer, WebSocket as NodeWebSocket } from 'ws'
import { Rpc } from '../index.js'

const port = 8082

// SERVER
const wss = new WebSocketServer({ port })
wss.on('connection', async function connection(aliceWS) {
  const aliceRpc = Rpc.fromWebSocket(aliceWS)
  aliceRpc.handle('add', ([a, b]) => a + b)
  aliceRpc.handle('exit', () => {
    console.log('Alice | received "exit" notification')
    aliceRpc.close()
    wss.close()
  })
})

// CLIENT
const clairWS = new WebSocket(`ws://localhost:${port}`)
const clairRpc = Rpc.fromWebSocket(clairWS)
clairWS.addEventListener('open', async () => {
  const res = await clairRpc.request('add', [3, 5])
  console.log('Clair | request add 3 + 5 =>', res)
  await clairRpc.notify('exit')
  
  clairRpc.close()
  clairWS.close()
  wss.close()  
})
