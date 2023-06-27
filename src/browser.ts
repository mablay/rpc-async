/* BROWSER DEPENDENCIES ONLY */
export { createRpc } from './rpc/router.js'
export { rpcFromWebSocket } from './rpc/from/web-socket.js'
export { rpcFromWebWorker } from './rpc/from/web-worker.js'
export type { Handler, Codec } from './rpc/types'
