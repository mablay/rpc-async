import { EventEmitter } from '@occami/events'
import { Handler, eventEmittersRpc } from '../..'

/** pretend local and remote peers */
export function rpcsFromEventEmitters<L extends Handler, R extends Handler>(localHandler: Handler, remoteHandler: Handler) {
  const [l, r] = [new EventEmitter(), new EventEmitter()]
  const local = eventEmittersRpc<R>(l, r)
  const remote = eventEmittersRpc<L>(r, l)
  local.wrap(localHandler, 2)
  remote.wrap(remoteHandler, 2)
  return { local, remote }
}
