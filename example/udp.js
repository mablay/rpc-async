import cluster from 'cluster'
import dgram from 'dgram'
import { Rpc } from '../index.js'
import { promisify } from 'util'

if (cluster.isPrimary) {
  appAlice()
} else {
  appBob()
}

async function appAlice () {
  const name = 'Alice'
  const port = 42544
  const remotePort = 42545
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

    // - handler -
    rpc.handle('chat', msg => {
      log('>', msg)
      rpc.notify('chat', 'me too!')
    })
    rpc.handle('add', ([a, b]) => (a + b))
    rpc.handle('exit', () => {
      log('closing')
      rpc.close()
      server.close()
      process.exit()
    })

    // spawn bob
    cluster.fork()
  })  
}

async function appBob (rpc) {
  const name = 'Bob  '
  const port = 42545
  const remotePort = 42544
  const log = (...args) => console.log(name, '|', ...args)

  const server = dgram.createSocket('udp4').bind(port, '127.0.0.1')
  server.send = promisify(server.send)
  server.on('error', (err) => log(`server error:\n${err.stack}`))
  // server.on('message', (msg, rinfo) => log(`received: ${msg} from ${rinfo.address}:${rinfo.port}`))

  server.on('listening', async () => {
    const address = server.address()
    log(`listening ${address.address}:${address.port}`)
  
    // const rpc = Rpc.fromUdpSocket(client)
    const rpc = new Rpc({
      send: req => server.send(JSON.stringify(req), remotePort, 'localhost'),
      attach: route => server.on('message', msg => route(JSON.parse(msg)))
    })

    // - handler -
    rpc.handle('chat', msg => log('>', msg))

    // - program -
    await rpc.notify('chat', 'feeling awesome!')
    const res = await rpc.request('add', [3, 5], 5000)
    log('3 + 5 =', res)
    await rpc.notify('exit')
    log('closing')
    rpc.close()
    server.close()
    process.exit()
  })  
}
