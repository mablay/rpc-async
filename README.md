# RPC Async

Builds RPC context on top of a loosely coupled communication protocols.

Inspired by [dnode](https://www.npmjs.com/package/dnode), [jayson](https://www.npmjs.com/package/jayson), [jsonrpc](https://www.jsonrpc.org/specification) and manny more.

Features

* Turns `.send(msg)` + `.on('message', responseHandler)` into `const response = await rpc.request()`
* custom message encoding
* NodeJS / Browser support
* Tested with WebSockets, EventEmitters, inter-process-communication, bidirectional UDP

## Usage

### Inter process communication
`shared-type.ts`
```ts
/* optional shared interface */
export type AddService = { add (a: number, b: number): number }
```

`parent.ts`
```ts
import { fork } from 'node:child_process'
import { ipcProcessRpc } from 'rpc-async'
import type { AddService } from './shared-type'

const child = fork('./ipc-child.js')
const rpc = ipcProcessRpc(child)
rpc.expose<AddService>({
  add: (a, b) => a + b
})
```

`child.ts`
```ts
import { ipcProcessRpc } from 'rpc-async'
import type { AddService } from './ipc-shared-type'

const rpc = ipcProcessRpc<AddService>(process)
rpc.request.add(3, 5).then((sum: number) => {
  console.log('3 + 5 =', sum)
  process.exit()
})
```

### Cluster

This example shows how two processes use RPC over IPC.

```ts
import cluster from 'node:cluster'
import { ipcProcessRpc } from 'rpc-async'

/* optional interface gives you code completion and type safety */
interface Server {
  add: (a: number, b: number) => number
  disconnect: () => void
}

if (cluster.isPrimary) {
  const worker = cluster.fork()
  const rpc = ipcProcessRpc(worker)
  /* ✅ Generic type warns about incomplete API implementation */
  rpc.expose<Server>({
    add: (a: number, b: number) => a + b,
    disconnect: () => cluster.disconnect()
  })
} else {
  /* ✅ Generic type gives your code completion*/
  const rpc = ipcProcessRpc<Server>(process)
  const sum = await rpc.request.add(3, 4)
  console.log('sum =', sum) // => 7
  rpc.notify.disconnect()
}

```

## Developer Notes

Read about rpc-async [protocol](https://github.com/mablay/rpc-async/blob/main/docs/PROTOCOL.md) specs.

Publish via 
```sh
npm run deploy [major|minor|patch]
# build > test > tag > publish #
```
