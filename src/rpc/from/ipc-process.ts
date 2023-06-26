import { createRpc } from '../../index.js'
import type { ChildProcess } from 'node:child_process'
import type { Worker } from 'node:cluster'
import type { Handler } from '../types'

export function rpcFromIpc<T extends Handler> (proc: ChildProcess | Worker | NodeJS.Process) {
  if (proc.send === undefined) {
    throw new Error('Process was not spawned with an IPC channel! Won\'t be able to use `process.send`!')
  }
  return createRpc<T>({
    send: req => proc.send!([req]),
    attach: route => {
      const $route = msg => msg.length === 1 && route(msg[0])
      proc.on('message', $route)
      return () => proc.removeListener('message', $route)
    }
  })
}
