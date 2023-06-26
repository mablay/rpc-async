# RPC Async

Isomorphic async RPCs on top of message based communication protocols.

Out of the box support for: 

* Browser WebSockets
* Browser WebWorker
* NodeJS IPC (inter-process-communication)
* NodeJS UDP sockets (bidirectional)
* NodeJS duplex streams

## Features

* timout control
* remote stack traces on / off
* default and user defined message encoding
* NodeJS and Browser support
* TypeScript support

## Usage

### RPC over IPC in a cluster

Both peers can expose and invoke RPC APIs. For brevity, only the server side is implemented in this example.

```ts
import cluster from 'node:cluster'
import { rpcFromIpc } from 'rpc-async'

/* optional interface */
interface Server {
  add: (a: number, b: number) => number
  disconnect: () => void
}

if (cluster.isPrimary) {
  /* --- MAIN PROCESS ---- */
  const worker = cluster.fork()
  const rpc = rpcFromIpc(worker)
  /* Implement and expose local methods.  
  ✅ Use generics for type safety */
  rpc.expose<Server>({
    add: (a: number, b: number) => a + b,
    disconnect: () => cluster.disconnect()
  })
} else {
  /* --- CHILD PROCESS ---- */
  /* ✅ Use generics for code completion */
  const rpc = rpcFromIpc<Server>(process)
  /* rpc.request[method]() invokes promisified non void remote methods */
  const sum = await rpc.request.add(3, 4)
  console.log('sum =', sum) // => 7
  /* rpc.notify[method]() invokes void remote methods */
  rpc.notify.disconnect()
}
```

## API

### Templates

* rpcFromStream ([source](src/rpc/from/duplex-stream.ts) | [test](src/test/tcp.test.ts))
* rpcFromIpc ([source](src/rpc/from/ipc-process.ts) | [test](src/test/ipc.test.ts))
* rpcFromUdp ([source](src/rpc/from/udp-socket.ts) | [test](src/test/udp.test.ts))
* rpcFromWebSocket ([source](src/rpc/from/web-socket.ts) | TODO )
* rpcFromWebWorker ([source](src/rpc/from/web-worker.ts) | TODO )

### User defined RPC template

If you have a communication channel that allows you to

* send messages
* listen to incoming messages
* remove your listener (optional, but recommended)

You can build your own RPC wrapper.

```ts
/* -- pseudocode for an imaginary "com"unication channel -- */
import { createRpc, type Handler } from "rpc-async"

export function myCustomRpc<T extends Handler>(com: any) {
  return createRpc<T>({
    /* required: send messages */
    send: msg => com.send(msg),
    /* required: listen to and route incoming messages and return a detach function */
    attach: (route) => {
      com.on('message', route)
      return () => com.removeListener('message', route)
    },
    /* optional message codec, depending on the needs of your communication channel */
    encode: (obj: any) => JSON.stringify(obj),
    decode: (text: string) => JSON.parse(text)
  })
}
```

## Developer Notes

Read about rpc-async [protocol](https://github.com/mablay/rpc-async/blob/main/docs/PROTOCOL.md) specs.

Publish via 
```sh
npm run deploy [major|minor|patch]
# build > test > tag > publish #
```

## Further reading

Credits

* [dnode](https://www.npmjs.com/package/dnode)
* [jayson](https://www.npmjs.com/package/jayson)
* [jsonrpc](https://www.jsonrpc.org/specification) and manny more.

Other similar solutions

[trpc](https://trpc.io) provides a feature rich "End-to-end typesafe API". 
