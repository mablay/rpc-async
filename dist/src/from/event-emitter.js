import { createRpc } from '../rpc';
/**
 * This implementation is meant for testing.
 *
 * Since both EventEmitters exist in the same execution context,
 * they can invoke their methods directly without the need of RPCs.
 */
export function eventEmittersRpc(local, remote) {
    return createRpc({
        send: req => remote.emit('rpc', req),
        attach: route => {
            local.on('rpc', route);
            return () => local.removeListener('rpc', route);
        }
    });
}
//# sourceMappingURL=event-emitter.js.map