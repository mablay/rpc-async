import { test } from 'zora'
import { EventEmitter } from '@occami/events'
import { Rpc } from '../index.js'

const wait = ms => new Promise(ok => setTimeout(ok, ms))
const hold = (ms, x) => wait(ms).then(() => x)
// const delay = (ms, fn) => wait(ms).then(fn)

function rpcsFromEventEmitters() {
  const [a, b] = [new EventEmitter(), new EventEmitter()]
  const alice = Rpc.fromEventEmitters(a, b)
  const bob = Rpc.fromEventEmitters(b, a)
  return [alice, bob]
}

test ('notify', t => {
  const [a, b] = rpcsFromEventEmitters()
  let delivered = false
  b.handle('foo', msg => {
    delivered = true
    t.equal(msg, 'bar', 'message is correct')
  })
  a.notify('foo', 'bar')
  t.ok(delivered, 'message has been delivered')
})

test ('request (success)', async t => {
  const [a, b] = rpcsFromEventEmitters()
  b.handle('add', ([x, y]) => hold(20, x + y))
  const sum = await a.request('add', [3, 5])
  t.equal(sum, 8, 'request has been handled successfully')
})
