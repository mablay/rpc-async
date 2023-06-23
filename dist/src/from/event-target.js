import { createRpc } from '../rpc';
/**
 * This implementation is meant for testing.
 *
 * Since both EventTargets exist in the same execution context,
 * they can invoke their methods directly without the need of RPCs.
 *
 * EventTarget & Event are native to the browser.
 * NodeJS introduced them in v14.5
 */
export function eventTargetsRpc(a, b) {
    class CustomEvent extends Event {
        constructor(message, data) {
            super(message);
            this.detail = data;
        }
    }
    return createRpc({
        send: data => b.dispatchEvent(new CustomEvent('rpc', data)),
        attach: route => {
            const $route = ev => route(ev.detail);
            a.addEventListener('rpc', $route);
            return () => a.removeEventListener('rpc', $route);
        }
    });
}
//# sourceMappingURL=event-target.js.map