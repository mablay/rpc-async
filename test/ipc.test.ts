import test from 'node:test'
import { equal } from 'node:assert'
import cluster from 'node:cluster'
import { createKitchenSink, KitchenSink } from './fixtures'
import { ipcProcessRpc } from '../dist'

test ('inter process communication', async t => {

  if (cluster.isPrimary) {
    const worker = cluster.fork({ execPath: 'tsx' })

    cluster.on('exit', (worker, code, signal) => {
      if (worker.exitedAfterDisconnect === true) {
        console.log('Oh, it was just voluntary – no need to worry');
      }
    })

    const rpc = ipcProcessRpc<KitchenSink>(worker)
    await new Promise((resolve) => rpc.handle('ready', resolve))
    const len = await rpc.request.pullArgs(3, 4)

    console.log('len:', len)
    rpc.notify.push()
    equal(len, 7)
    // worker.kill()
  } else {
    const rpc = ipcProcessRpc<{ ready: () => void }>(process)
    const kitchensink = createKitchenSink()
    rpc.wrap(kitchensink, 1)
    // rpc.handle('kill', () => process.exit())
    rpc.notify.ready()
  }
})
