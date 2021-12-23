import cluster from 'cluster'
import dgram from 'dgram'
import { Rpc } from '../index.js'
import { promisify } from 'util'

const [name, port, remotePort] = cluster.isPrimary
  ? ['Alice', 42544, 42545]
  : ['Bob  ', 42545, 42544]
const log = (...args) => console.log(name, '|', ...args)

const server = dgram.createSocket('udp4').bind(port, 'localhost')
server.send = promisify(server.send)
server.on('error', (err) => log(`server error:\n${err.stack}`))
// server.on('message', (msg, rinfo) => log(`received: ${msg} from ${rinfo.address}:${rinfo.port}`))

server.on('listening', async () => {
  const address = server.address()
  log(`listening ${address.address}:${address.port}`)

  // const rpc = Rpc.fromUdpSocket(client)
  const rpc = new Rpc({
    send: req => server.send(JSON.stringify(req), remotePort, '127.0.0.1'),
    attach: route => server.on('message', msg => route(JSON.parse(msg)))
  })

  if (cluster.isPrimary) {
    // Alice
    rpc.handle('chat', msg => {
      log('🔔 chat >', msg)
      rpc.notify('chat', 'me too!')
    })
    rpc.handle('add', ([a, b]) => (a + b))
    rpc.handle('exit', () => {
      log('🔔 exit')
      process.exit()
    })
    cluster.fork()
  } else {
    // Bob
    rpc.handle('chat', msg => log('🔔 chat >', msg))
    await rpc.notify('chat', 'feeling awesome!')
    const res = await rpc.request('add', [3, 5], 5000)
    log('🙇 add(3, 5) =', res)
    await rpc.notify('exit')
  }
})  
