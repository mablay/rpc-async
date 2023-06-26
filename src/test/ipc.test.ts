import test from 'node:test'
import assert from 'node:assert'
import cluster from 'node:cluster'
import { rpcFromIpc } from '../index.js'

interface Server {
  add: (a: number, b: number) => number
  disconnect: () => void
}

if (cluster.isPrimary) {
  test ('RPC over IPC cluster', async t => {
    const worker = cluster.fork()
    const rpc = rpcFromIpc(worker)
    rpc.expose<Server>({
      add: (a: number, b: number) => a + b,
      disconnect: () => cluster.disconnect()
    })
  })
} else {
  const rpc = rpcFromIpc<Server>(process)
  const sum = await rpc.request.add(3, 4)
  assert.equal(sum, 7)
  rpc.notify.disconnect()
}
