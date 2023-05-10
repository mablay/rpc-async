import type { ChildProcess } from 'node:child_process'
import { createRpc } from '../rpc'

export function ipcProcessRpc<T extends RPC.Handler> (proc: ChildProcess) {
  if (proc.send === undefined) {
    throw new Error('Process was not spawned with an IPC channel! Won\'t be able to use `process.send`!')
  }
  return createRpc<T>({
    send: req => proc.send(req),
    attach: route => {
      proc.on('message', route)
      return () => proc.removeListener('message', route)
    },
    decode (x: any) {
      console.log('[decode]', x)
      return x
    }
  })
}