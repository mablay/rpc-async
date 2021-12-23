import { EventEmitter } from '@occami/events'
import { Rpc } from '../index.js'

const [a, b] = [new EventEmitter(), new EventEmitter()]
const alice = Rpc.fromEventEmitters(a, b)
const bob = Rpc.fromEventEmitters(b, a)

bob.handle('chat', msg => console.log(`BOB received "${msg}" from Alice`))
bob.handle('add', ([x, y]) => x + y)

alice.notify('chat', 'Hey Bob, this is Alice!')
const z = await alice.request('add', [3, 5])
console.log('Alice asked Bob to calculate "3 + 5" and received', z)
