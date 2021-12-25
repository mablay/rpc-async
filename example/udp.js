import dgram from 'dgram'
import { Rpc } from '../index.js'

const alice = { port: 42544 }
const clair = { port: 42545 }

alice.socket = dgram.createSocket('udp4').bind(alice.port, 'localhost', () => {
  clair.socket = dgram.createSocket('udp4').bind(clair.port, 'localhost', () => {
    clair.socket.connect(alice.port, 'localhost', () => {
      clair.rpc = Rpc.fromSocketJSON(clair.socket)
      clair.rpc.handle('chat', msg => console.log('Clair | received:', msg))
      alice.socket.connect(clair.port, 'localhost', () => {
        alice.rpc = Rpc.fromSocketJSON(alice.socket)
        alice.rpc.handle('add', ([a, b]) => a + b)
        ready()
      })
    })
  })
})

async function ready () {
  console.log('Clair connected to Alice')
  alice.rpc.notify('chat', 'Hi Clair!')
  const answer = await clair.rpc.request('add', [7, -3])
  console.log('Alice | received: 7 - 3 =', answer)
  clair.rpc.close()
  alice.rpc.close()
  clair.socket.close()
  alice.socket.close()
}