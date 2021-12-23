import { EventEmitter } from 'events'
import { Rpc } from '../index.js'

const [a, b] = [new EventEmitter(), new EventEmitter()]
const alice = Rpc.fromEventEmitters(a, b)
const bob = Rpc.fromEventEmitters(b, a)

bob.handle('foo', msg => console.log('BOB | received:', msg))
alice.notify('foo', 'Hey Bob, this is Alice!')
