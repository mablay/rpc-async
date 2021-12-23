// msgpack5 is a binary object encoder and not part of this module
// run `npm i msgpack5` to install it.
import msgpack5 from 'msgpack5'
import { EventEmitter } from '@occami/events'
import { Rpc } from '../index.js'
const { encode, decode } = msgpack5()

let count = 1
function fromEventEmittersBinary (a, b) {
  return new Rpc({
    send: req => b.emit('rpc', req),
    attach: route => a.on('rpc', route),
    encode,
    decode,
    idgen: () => ++count
  })
}

const [a, b] = [new EventEmitter(), new EventEmitter()]
const alice = fromEventEmittersBinary(a, b)
const bob = fromEventEmittersBinary(b, a)

bob.handle('reverse', buffer => Buffer.from([...buffer.values()].reverse()))
// tap on the wire
b.on('rpc', buffer => console.log('Bob   received encoded message', buffer.toString('ascii')))
a.on('rpc', buffer => console.log('Alice received encoded message', buffer.toString('ascii')))

const orig = Buffer.from([0x41, 0x5A])
console.log('reverse', orig, 'via RPC, while sending it as actual buffer')
const buf = await alice.request('reverse', orig)
console.log('reversed buffer', buf)

/*
Here's what it looks like with JSON encoding
--------------------------------------------
reverse <Buffer 41 5a> via RPC, while sending it as actual buffer
Bob   received encoded message { id: 'xmbwu8sai7', method: 'reverse', params: <Buffer 41 5a> }
Alice received encoded message { id: 'xmbwu8sai7', error: undefined, result: <Buffer 5a 41> }
reversed buffer <Buffer 5a 41>

Now with msgpack5
-----------------
reverse <Buffer 41 5a> via RPC, while sending it as actual buffer
Bob   received encoded message "id*z52jghk743&method'reverse&paramsDAZ
Alice received encoded message "id*z52jghk743&resultDZA
reversed buffer <Buffer 5a 41>
*/