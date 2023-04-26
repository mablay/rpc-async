import { test } from 'node:test'
import assert from 'node:assert'
import { EventEmitter } from '@occami/events'
import { IRpc, Rpc } from '../index'

function rpcsFromEventEmitters<L extends IRpc, R extends IRpc>(a, b) {
  // const [a, b] = [new EventEmitter(), new EventEm itter()]
  const bob = Rpc.fromEventEmitters<R>(a, b)
  const alice = Rpc.fromEventEmitters<L>(b, a)
  return [alice, bob]
}

interface IAlice {
  count (): number
}

class Alice extends EventEmitter implements IAlice {
  counter = 0
  count () {
    return this.counter++
  }
}

interface IBob {
  put (item: any): Promise<string>
  get (key: string): Promise<any>
  close (): void
}

class Bob extends EventEmitter implements IBob {
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

test ('notify', async t => {
  const alice = new Alice()
  const bob = new Bob()
  const a = Rpc.fromEventEmitters<IAlice>(bob, alice)
  const b = Rpc.fromEventEmitters<IBob>(alice, bob)
  b.rpc.close()
  b.request('put', 7)
  // const [a, b] = rpcsFromEventEmitters<IAlice, IBob>(a, b)
  const i = await b.request('put', 'bar')
  let delivered = false
  b.handle('foo', msg => {
    delivered = true
    assert.equal(msg, 'bar', 'message is correct')
  })
  a.request('count', 3)
  assert.ok(delivered, 'message has been delivered')
})

test ('request (success)', async t => {
  const [a, b] = rpcsFromEventEmitters<any, any>(new Alice(), new Bob())
  b.handle('add', ([x, y]) => x + y)
  const sum = await a.request('add', [3, 5])
  assert.equal(sum, 8, 'request has been handled successfully')
})
