import test from 'node:test'
import assert from 'node:assert'
import cluster from 'node:cluster'
import { ipcProcessRpc } from '..'

interface Server {
  ready: () => void
}

interface Worker {
  add: (a: number, b: number) => number
  kill: () => void
}

if (cluster.isPrimary) {
  test ('RPC over IPC cluster', async t => {
    /// tsx is used to run untranspiled TypeScript in a worker
    const worker = cluster.fork({ execPath: 'tsx' })

    const rpc = ipcProcessRpc<Worker>(worker)
    await new Promise((resolve) => rpc.on('ready', resolve))

    const sum = await rpc.request.add(3, 4)
    assert.equal(sum, 7)

    // rpc.notify.kill()
    worker.kill()
  })
} else {
  const rpc = ipcProcessRpc<Server>(process)
  rpc.expose({
    add: (a: number, b: number) => a + b,
    kill: () => process.exit()
  })
  rpc.notify.ready()
}
