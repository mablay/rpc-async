import { fork } from 'child_process'
import { Rpc } from '../index.js'

process.name = 'PARENT'
const log = (...args) => console.log(process.name, '| main |', ...args)

const child = fork('./example/ipc-child.js')
const rpc = Rpc.fromIpcProcess(child)

// setup RPC handler
rpc.handle('add', remoteAdd)
rpc.handle('done', async () => {
  const greeting = await rpc.request('greet', 'world')
  log('received:', greeting)
  child.kill()
  process.exit()
})

// this method is executed remotely and responds via serialised messages
async function remoteAdd ([a, b]) {
  await new Promise(ok => setTimeout(ok, 500))
  log('executing remoteAdd', a, b)
  if (!Number.isFinite(b)) {
    throw new Error('Add requires two finite number arguments!')
  }
  return a + b
}
