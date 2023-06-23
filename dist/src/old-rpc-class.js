import { EventEmitter } from '@occami/events';
const log = (typeof window !== undefined && window?.env?.RPC_DEBUG ?? process) ? (...args) => console.log(process.name || Date.now(), '|  RPC |', ...args)
    :
;
/*
  EventEmitter is NodeJS native and not available in the browser.
  The popular 'events' module solves that, but it, but we don't need
  80kb of code for such a simple thing. So we went for '@occami/events'
  The browser native EventTarget class is available in NodeJS since v14.5.
  But it has a lot of business logic involved. Maybe a benchmark will show
  if we can ditch @occami/events for it.
*/
export class Rpc extends EventEmitter {
    static fromWebWorker(worker) {
        return new Rpc({
            send: data => worker.postMessage(data),
            attach: route => worker.addEventListener('message', event => route(event.data))
        });
    }
    /**
     * This was a naming accident.
     * NodeJS sockets operate on binary buffer
     * not on message level. Unless you establish
     * an abstraction layer on top, you won't be
     * able to run Rpc on top of a native socket.
     * @deprecated in favour of fromWebSocketJSON
     */
    static fromSocketJSON(socket, codec) {
        return Rpc.fromWebSocket(socket, codec);
    }
    /** Isomorphic implementation for
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API browser WebSockets}
     * and
     * {@link https://www.npmjs.com/package/ws NodeJS WebSockets}
     * .
     * Wich are similar but not identical.
     * Nodes *ws* module uses Buffer, while browser WebSockets use
     * ArrayBuffer as payload data type.
     *
     * This method covers that detail for you.
     *
     * JSON will be used as default codec unless you provide another.
     */
    static fromWebSocket(ws, codec) {
        const node = typeof process !== 'undefined' && !!process?.versions?.node;
        const binaryType = node ? 'nodebuffer' : 'arraybuffer';
        const convert = node
            ? (buffer) => buffer
            : (arrayBuffer) => { return new Uint8Array(arrayBuffer); };
        ws.binaryType = binaryType;
        return new Rpc({
            send: msg => ws.send(msg),
            attach: route => {
                const $route = (msg) => {
                    route(convert(msg.data));
                };
                ws.addEventListener('message', $route);
                return () => ws.removeEventListener('message', $route);
            },
            encode: codec ? codec.encode : x => JSON.stringify(x),
            decode: codec ? codec.decode : x => JSON.parse(x)
        });
    }
    static fromEventEmitters(a, b) {
        return new Rpc({
            send: req => b.emit('rpc', req),
            attach: route => {
                a.on('rpc', route);
                return () => a.removeListener('rpc', route);
            }
        });
    }
    // EventTarget & Event are native to the browser.
    // NodeJS introduced them in v14.5
    static fromEventTargets(a, b) {
        class CustomEvent extends Event {
            constructor(message, data) {
                super(message);
                this.detail = data;
            }
        }
        return new Rpc({
            send: data => b.dispatchEvent(new CustomEvent('rpc', data)),
            attach: route => {
                const etRoute = (ev => route(ev.detail));
                a.addEventListener('rpc', etRoute);
                return () => a.removeEventListener('rpc', etRoute);
            }
        });
    }
    static fromIpcProcess(proc) {
        if (proc.send === undefined) {
            throw new Error('Process was not spawned with an IPC channel! Won\'t be able to use `process.send`!');
        }
        return new Rpc({
            send: req => proc.send(req),
            attach: route => {
                proc.on('message', route);
                return () => proc.removeListener('message', route);
            }
        });
    }
    constructor(options) {
        super();
        this.timeout = 30000; // 30s as default timeout for requests
        this.resMap = new Map(); // maps responsed to requests
        const { send, attach, idgen } = options;
        const encode = (typeof options.encode === 'function') ? options.encode : (x) => x;
        const decode = (typeof options.decode === 'function') ? options.decode : (x) => x;
        this.idgen = (typeof idgen === 'function') ? idgen : () => Math.random().toString(36).slice(2);
        this.$send = payload => send(encode(payload)); // user defined "send"
        this.detach = attach((payload) => this.route(decode(payload))); // user defined "receive"
        // this.request = promisify(this.request) // <-- mutates member!
    }
    get rpc() {
        const self = this;
        return new Proxy({}, {
            get(target, prop, receiver) {
                // console.log({ target, prop, receiver })
                const ctx = {
                    [prop]: (params) => {
                        console.log('RPC:PROXY', `request(${prop}, ${params})`);
                        return self.request(prop, params);
                    }
                };
                return ctx[prop];
            }
        });
    }
    /* send message, not expecting a response */
    notify(method, params) {
        this.$send({ method, params });
    }
    /* send message that expects a response */
    request(method, params, timeoutms = this.timeout) {
        return new Promise((resolve, reject) => {
            this.$request(method, params, timeoutms, (error, result) => {
                error ? reject(error) : resolve(result);
            });
        });
    }
    /* send message that expects a response */
    $request(method, params, timeoutms, cb) {
        const id = this.idgen();
        // log(`send: ${method}(`, params, ') with timeout:', timeoutms)
        const timeout = setTimeout(() => {
            // log(`timeout: "${method}"`)
            clearTimeout(timeout);
            cb(new Error(`RpcAsync request "${method}" timed out!`));
        }, timeoutms);
        this.resMap.set(id, { cb, timeout });
        this.$send({ id, method, params });
    }
    // route incomming messages (notification, request, response)
    route(payload) {
        // log('route', payload)
        const { id, method, params, result, error } = payload;
        if (result || error) {
            // response
            const err = error ? new RpcError(error) : undefined;
            const req = this.resMap.get(id);
            if (req === undefined) {
                this.emit('response-unmapped-or-outdated');
                return;
            }
            this.resMap.delete(id);
            clearTimeout(req.timeout);
            req.cb(err, result);
        }
        else if (id) {
            // request
            this.emit(method, params, (error, result) => {
                this.$send({ id, error, result });
            });
        }
        else if (method) {
            // notification
            this.emit(method, params);
        }
        else {
            // invalid
            const err = new Error('Invalid RPC message!');
            err.message = payload;
            throw err;
        }
    }
    /* register handler for received requests / notifications */
    handle(method, fn) {
        this.on(method, async (params, cb) => {
            if (typeof cb !== 'function') {
                // handle notification
                fn(params);
                return;
            }
            // handle request
            try {
                const result = await fn(params);
                cb(undefined, result);
            }
            catch (error) {
                const { name, message, stack } = error;
                cb({ name, message, stack });
            }
        });
    }
    /**
     * If you allready have an object that provides all the
     * functionality you want to expose via RPC, just wrap it.
     */
    wrap(proxy) {
        if (proxy) {
            // wrap direct and prototype methods
            const methods = getMethods(proxy, 1).filter(m => m !== 'constructor');
            console.log('methods:', methods);
            for (const method of methods) {
                this.handle(method, proxy[method].bind(proxy));
            }
        }
        return this;
    }
    /* will reject all pending requests and close the underlying communication if defined */
    close() {
        for (const { cb } of this.resMap.values()) {
            cb('RpcClosing');
        }
        if (typeof this.detach === 'function') {
            this.detach();
        }
    }
}
class RpcError extends Error {
    constructor({ name, message }) {
        super(`${name}: ${message} (remote stack)`);
    }
}
function getMethods(obj, i = 1) {
    if (!obj || !i)
        return [];
    return getMethods(Object.getPrototypeOf(obj), --i).concat(Object.getOwnPropertyNames(obj)
        .map(method => typeof obj[method] === 'function' ? method : null)
        .filter(x => x));
}
//# sourceMappingURL=old-rpc-class.js.map