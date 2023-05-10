/// <reference path="../types.d.ts" />
import test from 'node:test'
import { equal } from 'node:assert'
import cluster from 'node:cluster'
import { createKitchenSink, KitchenSink } from './fixtures'
import { ipcProcessRpc } from '../src/from/ipc-process'

test ('inter process communication', async t => {

if (cluster.isPrimary) {
  const worker = cluster.fork()

  cluster.on('exit', (worker, code, signal) => {
    if (worker.exitedAfterDisconnect === true) {
      console.log('Oh, it was just voluntary – no need to worry');
    }
  });

  const rpc = ipcProcessRpc<KitchenSink>(<any>worker)
  try {
    const len = await new Promise((resolve, reject) => {
      rpc.handle('ready', async () => {
        rpc.request.pullArgs(3, 4)
          .then(resolve)
          .catch(reject)
      })
    })
    console.log('len:', len)
    equal(len, 5)
  } catch (error) {
    console.error(error)
  }
  // rpc.notify.kill()
  // worker.kill()
} else {
  const rpc = ipcProcessRpc<{ ready: () => void }>(<any>process)
  const kitchensink = createKitchenSink()
  rpc.wrap(kitchensink)
  rpc.handle('kill', () => process.exit())
  rpc.notify.ready()
}

})
