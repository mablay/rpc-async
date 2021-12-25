import cluster from 'cluster'
import { Rpc } from '../index.js'

if (cluster.isPrimary || cluster.isMaster) {
  // -- PARENT --
  const worker = cluster.fork()
  const rpc = Rpc.fromIpcProcess(worker)
  rpc.handle('add', ([a, b]) => a + b) // also works with async functions
  rpc.handle('exit', () => {
    console.log('parent | received "exit" notification')
    worker.kill()
  })
} else {
  // -- CHILD --
  const rpc = Rpc.fromIpcProcess(process)
  const sum = await rpc.request('add', [3, 5])
  console.log('child  | received 3 + 5 =', sum)
  rpc.notify('exit')
}

