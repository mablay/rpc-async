import test from 'node:test'
import { equal } from 'node:assert'
import { Alice, Bob, rpcsFromEventEmitters } from './fixtures'
import { IBob } from './fixtures/bob'

test ('RPC over event emitter', async t => {
  const { local, remote } = rpcsFromEventEmitters<Alice, IBob>(new Alice(), new Bob())
  local.notify.close()
  local.request.put(7)
  const key = await local.request.put('bar')
  equal(await local.request.get(key), 'bar')
  equal(await remote.request.count(), 0)
  await remote.notify.increment()
  equal(await remote.request.count(), 1)
})
