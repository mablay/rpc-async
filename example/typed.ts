import { EventEmitter } from '@occami/events'
import { IRpc, Rpc } from '../index'

const wait = ms => new Promise(ok => setTimeout(ok, ms))
const hold = (ms, x) => wait(ms).then(() => x)
// const delay = (ms, fn) => wait(ms).then(fn)


interface IBob {
  put (item: any): Promise<string>
  get (key: string): Promise<any>
  close (): void
}

class Bob extends EventEmitter implements IBob {
  store:Record<string, any> = {}
  async put (item: any) {
    const key = Date.now().toString(36)
    this.store[key] = item
    return hold(50, key)
  }
  get (key: string) {
    console.log('Bob get', key)
    return hold(50, this.store[key])
  }
  close () {}
}


(async () => {
  const [a, b] = [new EventEmitter(), new EventEmitter()]
  const local = Rpc.fromEventEmitters<IBob>(a, b)
  const remote = Rpc.fromEventEmitters(b, a)

  const bob = new Bob()
  remote.handle('put', value => bob.put(value))
  remote.handle('get', value => bob.get(value))

  const key = await local.rpc.put('foo')
  const val = await local.rpc.get(key)
  console.log('val:', val)
  
})()
