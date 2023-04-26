import { createWebServer } from './server-util.js'
import { Rpc } from '../../index.js'

// class Backend {
//   add (a, b) {
//     return a + b
//   }
// }
// const backend = new Backend()
const backend = {
  lorem: () => 'ipsum'
}
// @ts-ignore
backend.foo = () => 'bar'

createWebServer(async ws => {
  const rpc = Rpc.fromSocketJSON(ws).wrap(backend)
  // rpc.handle('add', ([a, b]) => a + b)
  const res = await rpc.request('greet', ['foo'])
  console.log('=>', res)
})
