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
`parent.js`
```js
import { Rpc } from 'rpc-async'
import { fork } from 'child_process'
const child = fork('./example/ipc-child.js')
const rpc = Rpc.fromIpcProcess(child)
rpc.handle('add', ([a, b]) => a + b) // also works with async functions
```

`child.js`
```js
import { Rpc } from 'rpc-async'
const rpc = Rpc.fromIpcProcess(process)
rpc.request('add', [3, 5]).then(sum => {
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
