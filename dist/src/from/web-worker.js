import { createRpc } from '../rpc';
export function webWorkerRpc(worker) {
    return createRpc({
        send: data => worker.postMessage(data),
        attach: route => {
            const $route = event => route(event.data);
            worker.addEventListener('message', $route);
            return () => worker.removeEventListener('message', $route);
        }
    });
}
//# sourceMappingURL=web-worker.js.map