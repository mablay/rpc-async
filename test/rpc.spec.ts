/// <reference path="../types.d.ts" />
import test from 'node:test'
import assert from 'node:assert'
import { EventEmitter } from '@occami/events'
import { rpcsFromEventEmitters } from './helper'

class Alice extends EventEmitter {
  counter = 0
  increment () {
    this.counter++
  }
  count () {
    return this.counter
  }
}

class Bob extends EventEmitter {
  store:Record<string, any> = {}
  put (item: any) {
    const key = Date.now().toString(36)
    this.store[key] = item
    return Promise.resolve(key)
  }
  get (key: string) {
    return Promise.resolve(this.store[key])
  }
  close () {}
}

test ('rpcsFromEventEmitters', async t => {
  const { local, remote } = rpcsFromEventEmitters<Alice, Bob>(new Alice(), new Bob())
  local.notify.close()
  local.request.put(7)
  // const [a, b] = rpcsFromEventEmitters<IAlice, IBob>(a, b)
  const i = await local.request.put('bar')
  assert.equal(await remote.request.count(), 0)
  await remote.notify.increment()
  assert.equal(await remote.request.count(), 1)
})

// test ('request (success)', async t => {
//   const { local: a, remote: b } = rpcsFromEventEmitters<Alice, Bob>(new Alice(), new Bob())
//   const sum = await a.request.count()
//   assert.equal(sum, 8, 'request has been handled successfully')
// })
