import { fork } from 'child_process'
import { test } from 'zora'
import { Rpc } from '../index.js'

test('RPC over IPC', async t => {
  const child = fork('./test/ipc-child.js')
  const rpc = Rpc.fromIpcProcess(child)
  await new Promise(resolve => {
    rpc.handle('foo', msg => resolve(t.equal(msg, 'bar')))
  })
  child.kill()
})
