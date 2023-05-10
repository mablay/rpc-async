import test from 'node:test'
import assert from 'node:assert'
import { rpcsFromEventEmitters } from './helper'

const wait = ms => new Promise(ok => setTimeout(ok, ms))
const hold = (ms, x) => wait(ms).then(() => x)
// const delay = (ms, fn) => wait(ms).then(fn)

class Alice {
  foo (msg: string) {

  }
}

class Bob {
  count: number
  constructor () {
    this.count = 0
  }
  increment () {
    this.count++
  }
  counter () {
    return this.count
  }
}

test ('notify', {skip: true}, async t => {
  const { local: alice, remote: bob } = rpcsFromEventEmitters<Alice, Bob>(new Alice(), new Bob())
  assert.equal(await alice.request.counter(), 0)
  await alice.notify.increment()
  assert.equal(await alice.request.counter(), 1)
})

// test ('request (success)', async t => {
//   const [a, b] = rpcsFromEventEmitters()
//   b.handle('add', ([x, y]) => hold(20, x + y))
//   const sum = await a.request('add', [3, 5])
//   t.equal(sum, 8, 'request has been handled successfully')
// })
