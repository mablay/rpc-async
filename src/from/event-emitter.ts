import { EventEmitter } from '@occami/events'
import { createRpc } from '../rpc'

/**
 * This implementation is meant for testing.
 * 
 * Since both EventEmitters exist in the same execution context,
 * they can invoke their methods directly without the need of RPCs.
 */
export function eventEmittersRpc<R extends RPC.Handler> (local: EventEmitter, remote: EventEmitter) {
  return createRpc<R>({
    send: req => remote.emit('rpc', req),
    attach: route => {
      local.on('rpc', route)
      return () => local.removeListener('rpc', route)
    }
  })
}