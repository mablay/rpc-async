import { EventEmitter } from '@occami/events'
import { eventEmittersRpc } from '../..'

/** pretend local and remote peers */
export function rpcsFromEventEmitters<L extends RPC.Handler, R extends RPC.Handler>(localHandler: RPC.Handler, remoteHandler: RPC.Handler) {
  const [l, r] = [new EventEmitter(), new EventEmitter()]
  const local = eventEmittersRpc<R>(l, r)
  const remote = eventEmittersRpc<L>(r, l)
  local.wrap(localHandler)
  remote.wrap(remoteHandler)
  return { local, remote }
}
