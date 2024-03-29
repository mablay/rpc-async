export { createRpc } from './rpc/router.js'
// // NODE.JS
export { rpcFromIpc } from './rpc/from/ipc-process.js'
export { rpcFromUdp } from './rpc/from/udp-socket.js'
export { rpcFromStream} from './rpc/from/duplex-stream.js'
// // BROWSER
export { rpcFromWebSocket } from './rpc/from/web-socket.js'
export { rpcFromWebWorker } from './rpc/from/web-worker.js'
export type { Handler, Codec } from './rpc/types'
