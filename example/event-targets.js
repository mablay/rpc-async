import { Rpc } from '../index.js'

const [a, b] = [new EventTarget(), new EventTarget()]
const alice = Rpc.fromEventTargets(a, b)
const bob = Rpc.fromEventTargets(b, a)

bob.handle('chat', msg => console.log(`BOB received "${msg}" from Alice`))
bob.handle('add', ([x, y]) => x + y)

alice.notify('chat', 'Hey Bob, this is Alice!')
const z = await alice.request('add', [3, 5])
console.log('Alice asked Bob to calculate "3 + 5" and received', z)
