/// <reference path="../types.d.ts" />

import { EventEmitter } from '@occami/events'
import { defaultIdGen } from './id-gen'
import { createLogger } from './log'

const log = createLogger()

/*
  EventEmitter is NodeJS native and not available in the browser.
  The popular 'events' module solves that, but it, but we don't need
  80kb of code for such a simple thing. So we went for '@occami/events'
  The browser native EventTarget class is available in NodeJS since v14.5.
  But it has a lot of business logic involved. Maybe a benchmark will show
  if we can ditch @occami/events for it.
*/
export function createRpc<RemoteHandler extends RPC.Handler> (options: RPC.RpcOptions) {
  type T = RemoteHandler
  type Notifications = RPC.PickNotifications<T>
  type NotifyMethods = keyof Notifications
  type Requests = RPC.PromisifyRequests<T>
  type RequestMethods = keyof Requests
  
  // timeout: number
  // resMap: Map<string, ResponseMapValue>
  // $send: (payload: Payload) => void
  // detach: () => void
  // idgen: () => string

  const timeout = options.timeout ?? 30000 // 30s as default timeout for requests
  const resMap = new Map<string, RPC.ResponseMapValue>() // maps response to requests
  const { send, attach } = options
  const idgen = options.idgen ?? defaultIdGen
  const encode = (typeof options.encode === 'function') ? options.encode : (x:any) => x
  const decode = (typeof options.decode === 'function') ? options.decode : (x:any) => x
  const $send = payload => send(encode(payload)) // user defined "send"
  const detach = attach((payload: any) => route(decode(payload))) || (() => {}) // user defined "receive"
  const emitter = new EventEmitter()
  // this.request = promisify(this.request) // <-- mutates member!
  

  /* send message, not expecting a response */
  function notify (method: NotifyMethods, params?: any) {
    $send({ method, params })
  }
  
  /* send message that expects a response */
  function request (method: RequestMethods, params, timeoutms = timeout) {
    type RV = ReturnType<T[RequestMethods]>
    return new Promise<RV>((resolve, reject) => {
      $request(method, params, timeoutms, (error, result) => {
        error ? reject(error) : resolve(result)
      })
    })
  }

  /* send message that expects a response */
  function $request (method: RequestMethods, params, timeoutms, cb) {
    const id = idgen()
    log(`send: ${<string>method}(${Array.isArray(params) ? params.join(', ') : ''}) with timeout:`, timeoutms)
    const timeout = setTimeout(() => {
      log(`timeout: "${<string>method}"`)
      clearTimeout(timeout)
      cb(new Error(`RpcAsync request "${<string>method}" timed out!`))
    }, timeoutms)
    resMap.set(id, { cb, timeout })
    $send({ id, method, params })
  }

  // route incomming messages (notification, request, response)
  function route (payload: RPC.Payload) {
    log('route', payload)
    const { id, method, params, result, error } = payload
    if (result !== undefined || error !== undefined) {
      // response
      const err = error ? new RpcError(error) : undefined
      const req = resMap.get(id)
      if (req === undefined) {
        emitter.emit('response-unmapped-or-outdated')
        return
      }
      resMap.delete(id)
      clearTimeout(req.timeout)
      req.cb(err, result)
    } else if (id && method) {
      // request
      log('request', method, params)
      if (emitter.listenerCount(method) === 0) {
        $send({ id, error: {
          name: 'UNKNOWN_METHOD',
          message: `unknown method "${method}"!`
        } })
        return
      }  
      emitter.emit(method, params, (error, result) => {
        $send({ id, error, result })
      })
    } else if (method) {
      // notification
      emitter.emit(method, params)
    } else {
      // invalid
      const err: any = new Error('Invalid RPC message!')
      err.message = payload
      throw err
    }
  }

  /* register handler for received requests / notifications */
  function handle (method, fn) {
    emitter.on(method, async (params, cb) => {
      if (typeof cb !== 'function') {
        // handle notification
        fn(params)
        return 
      }
      // handle request
      try {
        const result = await fn(params)
        cb(undefined, result)
      } catch (error) {
        const { name, message, stack } = <any>error
        cb({ name, message, stack })
      }
    })
  }

  const proxyRequest = <Requests>new Proxy({}, {
    get(target, prop: string, receiver) {
      return params => request(<any>prop, params)
    }
  })

  const proxyNotify = <Notifications>new Proxy({}, {
    get(target, prop: string, receiver) {
      return params => notify(<any>prop, params)
    }
  })

  /* will reject all pending requests and close the underlying communication if defined */
  function close () {
    for (const { cb } of resMap.values()) {
      cb('RpcClosing')
    }
    detach()
  }

  /** handles own methods of a given object */
  function wrap (proxy: any) {
    const props = getMethods(proxy) // Object.getOwnPropertyNames(proxy)
    for (const prop of props) {
      if (typeof proxy[prop] !== 'function') continue
      log('wrap', proxy.constructor?.name, prop)
      handle(prop, proxy[prop].bind(proxy))
    }
  }

  return {
    handle,
    wrap,
    notify: proxyNotify,
    request: proxyRequest,
    close
  }
}

class RpcError extends Error {
  constructor ({ name, message }) {
    super(`${name}: ${message} (remote stack)`)
  }
}

function getMethods (obj, i = 2) {
  if (!obj || !i) return []
  return getMethods(Object.getPrototypeOf(obj), --i).concat(
    Object.getOwnPropertyNames(obj)
    .map(method => typeof obj[method] === 'function' ? method : null)
    .filter(x => x)
  )
}
