import { EventEmitter } from '@occami/events';
import { defaultIdGen } from './id-gen';
import { createLogger } from './log';
const log = createLogger();
/*
  EventEmitter is NodeJS native and not available in the browser.
  The popular 'events' module solves that, but it, but we don't need
  80kb of code for such a simple thing. So we went for '@occami/events'
  The browser native EventTarget class is available in NodeJS since v14.5.
  But it has a lot of business logic involved. Maybe a benchmark will show
  if we can ditch @occami/events for it.
*/
export function createRpc(options) {
    // timeout: number
    // resMap: Map<string, ResponseMapValue>
    // $send: (payload: Payload) => void
    // detach: () => void
    // idgen: () => string
    const timeout = options.timeout ?? 30000; // 30s as default timeout for requests
    const resMap = new Map(); // maps response to requests
    const { send, attach } = options;
    const idgen = options.idgen ?? defaultIdGen;
    const encode = (typeof options.encode === 'function') ? options.encode : (x) => x;
    const decode = (typeof options.decode === 'function') ? options.decode : (x) => x;
    const $send = payload => send(encode(payload)); // user defined "send"
    const detach = attach((payload) => route(decode(payload))) || (() => { }); // user defined "receive"
    const emitter = new EventEmitter();
    // this.request = promisify(this.request) // <-- mutates member!
    /* send message, not expecting a response */
    function notify(method, params) {
        $send({ method, params });
    }
    /* send message that expects a response */
    function request(method, params, timeoutms = timeout) {
        return new Promise((resolve, reject) => {
            $request(method, params, timeoutms, (error, result) => {
                error ? reject(error) : resolve(result);
            });
        });
    }
    /* send message that expects a response */
    function $request(method, params, timeoutms, cb) {
        const id = idgen();
        log(`send: ${method}(${Array.isArray(params) ? params.join(', ') : ''}) with timeout:`, timeoutms);
        const timeout = setTimeout(() => {
            log(`timeout: "${method}"`);
            clearTimeout(timeout);
            cb(new Error(`RpcAsync request "${method}" timed out!`));
        }, timeoutms);
        resMap.set(id, { cb, timeout });
        $send({ id, method, params });
    }
    // route incomming messages (notification, request, response)
    function route(payload) {
        log('route', payload);
        const { id, method, params, result, error } = payload;
        if (result !== undefined || error !== undefined) {
            // response
            const err = error ? new RpcError(error) : undefined;
            const req = resMap.get(id);
            if (req === undefined) {
                emitter.emit('response-unmapped-or-outdated');
                return;
            }
            resMap.delete(id);
            clearTimeout(req.timeout);
            req.cb(err, result);
        }
        else if (id && method) {
            // request
            log('request', method, params);
            if (emitter.listenerCount(method) === 0) {
                $send({ id, error: {
                        name: 'UNKNOWN_METHOD',
                        message: `unknown method "${method}"!`
                    } });
                return;
            }
            emitter.emit(method, params, (error, result) => {
                $send({ id, error, result });
            });
        }
        else if (method) {
            // notification
            emitter.emit(method, params);
        }
        else {
            // invalid
            if (options.ignoreInvalidMessages)
                return;
            const err = new Error('Invalid RPC message!');
            err.message = payload;
            throw err;
            // console.warn(err.message)
        }
    }
    /* register handler for received requests / notifications */
    function handle(method, fn) {
        emitter.on(method, async (params, cb) => {
            if (typeof cb !== 'function') {
                // handle notification
                fn(...params);
                return;
            }
            // handle request
            try {
                const result = await fn(...params);
                cb(undefined, result);
            }
            catch (error) {
                const { name, message, stack } = error;
                cb({ name, message, stack });
            }
        });
    }
    const proxyRequest = new Proxy({}, {
        get(target, prop, receiver) {
            return (...params) => request(prop, params);
        }
    });
    const proxyNotify = new Proxy({}, {
        get(target, prop, receiver) {
            return (...params) => notify(prop, params);
        }
    });
    /* will reject all pending requests and close the underlying communication if defined */
    function close() {
        for (const { cb } of resMap.values()) {
            cb('RpcClosing');
        }
        detach();
    }
    /** handles own methods of a given object */
    function wrap(proxy, depth = 1) {
        const props = getMethods(proxy, depth); // Object.getOwnPropertyNames(proxy)
        for (const prop of props) {
            if (typeof proxy[prop] !== 'function')
                continue;
            log('wrap', proxy.constructor?.name, prop);
            handle(prop, proxy[prop].bind(proxy));
        }
        return rpc;
    }
    const rpc = {
        handle,
        wrap,
        notify: proxyNotify,
        request: proxyRequest,
        close,
        emitter
    };
    return rpc;
}
class RpcError extends Error {
    constructor({ name, message }) {
        super(`${name}: ${message} (remote stack)`);
    }
}
function getMethods(obj, i = 2) {
    if (!obj || !i)
        return [];
    return getMethods(Object.getPrototypeOf(obj), --i).concat(Object.getOwnPropertyNames(obj)
        .map(method => typeof obj[method] === 'function' ? method : null)
        .filter(x => x));
}
//# sourceMappingURL=rpc.js.map