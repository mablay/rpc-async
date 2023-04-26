// @ts-ignore
import { Rpc } from '/rpc-async.js'
console.log('hello world')

const ws = new WebSocket('ws://localhost:9090/ws')
ws.addEventListener('open', async () => {
  console.log('OPEN')
  const rpc = Rpc.fromSocketJSON(ws)
  rpc.handle('greet', ([name]) => `Hello ${name}!`)
  const sum = await rpc.request('add', [3, 5])
  console.log('3 + 5 =', sum)
})