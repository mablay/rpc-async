import { EventEmitter } from '@occami/events'
// const log = (...args) => console.log(process.name || Date.now(), '|  RPC |', ...args)
const log = (...args:any[]) => {}

export type RpcOptions = {
  send: SendFn
  /** if it returns a function, this function is used to disconnect from the underlying connection */
  attach: (route: any) => any
  encode?: (input: any) => any
  decode?: (output: any) => any
  idgen?: () => string
}

type SendFn = (data: any) => any

export type ResponseMapValue = {
  cb: Callback
  timeout: number
}

export type Callback = (err?: any, value?: any) => void

/*
  EventEmitter is NodeJS native and not available in the browser.
  The popular 'events' module solves that, but it, but we don't need
  80kb of code for such a simple thing. So we went for '@occami/events'
  The browser native EventTarget class is available in NodeJS since v14.5.
  But it has a lot of business logic involved. Maybe a benchmark will show
  if we can ditch @occami/events for it.
*/
export class Rpc extends EventEmitter {
  static fromWebWorker (worker: any) {
    return new Rpc({
      send: data => worker.postMessage(data),
      attach: route => worker.addEventListener('message', event => route(event.data))
    })  
  }
  
  static fromSocketJSON (socket) {
    return new Rpc({
      send: data => socket.send(data),
      attach: route => {
        socket.on('message', route)
        return () => socket.removeListener('message', route)
      },
      encode: JSON.stringify,
      decode: JSON.parse
    })
  }

  static fromEventEmitters (a, b) {
    return new Rpc({
      send: req => b.emit('rpc', req),
      attach: route => {
        a.on('rpc', route)
        return () => a.removeListener('rpc', route)
      }
    })
  }

  // EventTarget & Event are native to the browser.
  // NodeJS introduced them in v14.5
  static fromEventTargets (a, b) {
    class CustomEvent extends Event {
      detail: any
      constructor(message, data) {
        super(message)
        this.detail = data
      }
    }    
    return new Rpc({
      send: data => b.dispatchEvent(new CustomEvent('rpc', data)),
      attach: route => {
        const etRoute = (ev => route(ev.detail))
        a.addEventListener('rpc', etRoute)
        return () => a.removeEventListener('rpc', etRoute)
      }
    })
  }

  static fromIpcProcess (proc) {
    return new Rpc({
      send: req => proc.send(req),
      attach: route => {
        proc.on('message', route)
        return () => proc.removeListener('message', route)
      }
    })
  }

  timeout: number
  resMap: Map<string, ResponseMapValue>
  $send: (payload: any) => SendFn
  detach: () => void
  idgen: () => string

  constructor (options: RpcOptions) {
    super()
    this.timeout = 30000 // 30s as default timeout for requests
    this.resMap = new Map() // maps responsed to requests
    const { send, attach, idgen } = options
    const encode = (typeof options.encode === 'function') ? options.encode : (x:any) => x
    const decode = (typeof options.decode === 'function') ? options.decode : (x:any) => x
    this.idgen = (typeof idgen === 'function') ? idgen : () => Math.random().toString(36).slice(2)
    this.$send = payload => send(encode(payload)) // user defined "send"
    this.detach = attach((payload: any) => this.route(decode(payload))) // user defined "receive"
    // this.request = promisify(this.request) // <-- mutates member!
  }

  /* send message, not expecting a response */
  notify (method: string, params: any) {
    return this.$send({ method, params })
  }

  /* send message that expects a response */
  request (method, params, timeoutms = this.timeout) {
    return new Promise((resolve, reject) => {
      this.$request(method, params, timeoutms, (error, result) => {
        error ? reject(error) : resolve(result)
      })
    })
  }
  
  /* send message that expects a response */
  $request (method, params, timeoutms, cb) {
    const id = this.idgen()
    log(`send: ${method}(`, params, ') with timeout:', timeoutms)
    const timeout = setTimeout(() => {
      log(`timeout: "${method}"`)
      clearTimeout(timeout)
      cb(new Error(`RpcAsync request "${method}" timed out!`))
    }, timeoutms)
    this.resMap.set(id, { cb, timeout })
    this.$send({ id, method, params })
  }

  // route incomming messages (notification, request, response)
  route (payload: any) {
    log('route', payload)
    const { id, method, params, result, error } = payload
    if (result || error) {
      // response
      const err =  error ? new RpcError(error) : undefined
      const req = this.resMap.get(id)
      if (req === undefined) {
        this.emit('response-unmapped-or-outdated')
        return
      }
      this.resMap.delete(id)
      clearTimeout(req.timeout)
      req.cb(err, result)
    } else if (id) {
      // request
      this.emit(method, params, (error, result) => {
        this.$send({ id, error, result })
      })
    } else if (method) {
      // notification
      this.emit(method, params)
    } else {
      // invalid
      const err = new Error('Invalid RPC message!')
      err.message = payload
      throw err
    }
  }

  /* register handler for received requests / notifications */
  handle (method, fn) {
    this.on(method, async (params, cb) => {
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

  /* will reject all pending requests and close the underlying communication if defined */
  close () {
    for (const { cb } of this.resMap.values()) {
      cb('RpcClosing')
    }
    if (typeof this.detach === 'function') {
      this.detach()
    }
  }
}

class RpcError extends Error {
  constructor ({ name, message }) {
    super(`${name}: ${message} (remote stack)`)
  }
}