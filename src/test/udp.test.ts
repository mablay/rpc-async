import test from 'node:test'
import { equal } from 'node:assert'
import { Socket, createSocket } from 'node:dgram'
import { udpJsonRpc } from '../rpc/from/udp-socket'

interface IServer {
  add (a: number, b: number): number
  kill (): void
}

test ('RPC over UDP connection', async t => {
  const server = await udpSocket()
  const client = await udpSocket()

  // --- PEER1 (let's call it server) --- //
  const serverRpc = udpJsonRpc<IServer>(server.socket, client.port)
  serverRpc.expose<IServer>({
    add: (a: number, b: number) => a + b,
    kill: () => { server.socket.close() }
  })

  // --- PEER2 (let's call it client) --- //
  const clientRpc = udpJsonRpc<IServer>(client.socket, server.port)
  const sum = await clientRpc.request.add(3, 4)
  equal(sum, 7)
  clientRpc.notify.kill()
  setImmediate(() => client.socket.close())
})

// --- Helper Function - UDP Socket as promise --- //

interface UdpSocket {
  socket: Socket
  port: number
}

function udpSocket (type: 'udp4' | 'udp6' = 'udp4'): Promise<UdpSocket> {
  return new Promise((resolve, reject) => {
    const socket = createSocket({ type }).bind(() => {
      try {
        const { port } = socket.address()
        resolve({ socket, port })
      } catch (error) {
        reject(error)
      }
    })
  })
}
