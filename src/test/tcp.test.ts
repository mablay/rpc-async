import test from 'node:test'
import { equal } from 'node:assert'
import { AddressInfo, createConnection, createServer } from 'node:net'
import { rpcFromStream } from '../index.js'

interface IClient {
  add (a: number, b: number): number
  kill (): void
}

test ('Rpc over TCP connection', async t => {
  // create server
  const server = createServer(async socket => {
    const rpc = rpcFromStream<IClient>(socket)
    const sum = await rpc.request.add(3, 4)
    equal(sum, 7)
    rpc.notify.kill()
    server.close()
  }).listen()
  const { port } = <AddressInfo>server.address()

  // create client
  const socket = createConnection({ port })
  const rpc = rpcFromStream(socket)
  rpc.expose<IClient>({
    add: (a: number, b: number) => a + b,
    kill: () => socket.destroy()
  })
})
