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

### RPC over IPC - child process
`shared-type.ts`
```ts
/* optional shared interface */
export type AddService = { add (a: number, b: number): number }
```

`parent.ts`
```ts
import { fork } from 'node:child_process'
import { rpcFromIpc } from 'rpc-async'
import type { AddService } from './shared-type'

const child = fork('./ipc-child.js')
const rpc = rpcFromIpc(child)
rpc.expose<AddService>({
  add: (a, b) => a + b
})
```

`child.ts`
```ts
import { rpcFromIpc } from 'rpc-async'
import type { AddService } from './ipc-shared-type'

const rpc = rpcFromIpc<AddService>(process)
rpc.request.add(3, 5).then((sum: number) => {
  console.log('3 + 5 =', sum)
  process.exit()
})
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
