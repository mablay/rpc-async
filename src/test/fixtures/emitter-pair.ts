import { EventEmitter } from '@occami/events'
import { Handler, eventEmittersRpc } from '../..'

/** pretend local and remote peers */
export function rpcsFromEventEmitters<L extends Handler, R extends Handler>(localHandler: Handler, remoteHandler: Handler) {
  const [l, r] = [new EventEmitter(), new EventEmitter()]
  const local = eventEmittersRpc<R>(l, r)
  const remote = eventEmittersRpc<L>(r, l)
  local.expose(localHandler, localHandler.constructor)
  remote.expose(remoteHandler, remoteHandler.constructor)
  return { local, remote }
}
