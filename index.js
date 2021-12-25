import { EventEmitter } from '@occami/events'
// const log = (...args) => console.log(process.name || Date.now(), '|  RPC |', ...args)
const log = () => {}

export class Rpc extends EventEmitter {
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

  static fromIpcProcess (proc) {
    return new Rpc({
      send: req => proc.send(req),
      attach: route => {
        proc.on('message', route)
        return () => proc.removeListener('message', route)
      }
    })
  }

  constructor ({ send, attach, encode, decode, idgen }) {
    super()
    this.timeout = 30000 // 30s as default timeout for requests
    this.resMap = new Map() // maps responsed to requests
    if (encode === undefined) encode = x => x
    if (decode === undefined) decode = x => x
    this.$send = payload => send(encode(payload)) // user defined "send"
    this.detach = attach(payload => this.route(decode(payload))) // user defined "receive"
    // this.request = promisify(this.request) // <-- mutates member!
    this.idgen = (typeof idgen === 'function') ? idgen : () => Math.random().toString(36).slice(2)
  }

  /* send message, not expecting a response */
  notify (method, params) {
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
  route (payload) {
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
      err.rpcMessage = payload
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
        const { name, message, stack } = error
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
