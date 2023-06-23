import { createRpc } from '../rpc';
/**
 * IPC may involve RPC unrelated communication that needs to be
 * filtered. We do so by putting our object under a key that is
 * unlikely to collide with other communication strategies.
 */
const RPC_SYMBOL = '🌈';
export function ipcProcessRpc(proc) {
    if (proc.send === undefined) {
        throw new Error('Process was not spawned with an IPC channel! Won\'t be able to use `process.send`!');
    }
    return createRpc({
        send: req => proc.send({ [RPC_SYMBOL]: req }),
        attach: route => {
            const $route = msg => msg[RPC_SYMBOL] && route(msg[RPC_SYMBOL]);
            proc.on('message', $route);
            return () => proc.removeListener('message', $route);
        },
        decode(x) {
            // console.log('[decode]', x)
            return x;
        },
        ignoreInvalidMessages: true
    });
}
//# sourceMappingURL=ipc-process.js.map