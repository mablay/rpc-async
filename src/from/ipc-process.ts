import type { ChildProcess } from 'node:child_process'
import { createRpc } from '../rpc'
import type { Worker } from 'node:cluster'
import { inspect } from 'node:util'

/**
 * IPC may involve RPC unrelated communication that needs to be
 * filtered. We do so by putting our object under a key that is
 * unlikely to collide with other communication strategies.
 */
const RPC_SYMBOL = '🌈'

export function ipcProcessRpc<T extends RPC.Handler> (proc: ChildProcess | Worker | NodeJS.Process) {
  if (proc.send === undefined) {
    throw new Error('Process was not spawned with an IPC channel! Won\'t be able to use `process.send`!')
  }
  return createRpc<T>({
    send: req => proc.send!({ [RPC_SYMBOL]: req }),
    attach: route => {
      const $route = msg => msg[RPC_SYMBOL] && route(msg[RPC_SYMBOL])
      proc.on('message', $route)
      return () => proc.removeListener('message', $route)
    },
    decode (x: any) {
      // console.log('[decode]', x)
      return x
    },
    ignoreInvalidMessages: true
  })
}