/*
 * Wrap an existing message based communication.
 * encode & send
 * receive & decode
 */

import { createHandler } from './handler'
import { network } from './network'
import { createLogger } from './plugins/debug-logger'
import { jobQueue } from './queue'
import { RpcError } from './util'
import type { DetatchFn, Handler, Payload, PickNotifications, PromisifyRequests, RpcOptions, SendFn } from './types'

export interface NetworkOptions {
  /** send a message using the underlying connection */
  send: SendFn
  /** if it returns a function, this function is used to disconnect from the underlying connection */
  attach: (route: any) => DetatchFn | void
}

/** TODO: find a better name */
export function createRpc<RemoteHandler extends Handler> (options: RpcOptions) {
  type T = RemoteHandler
  type Notifications = PickNotifications<T>
  type NotifyMethods = keyof Notifications
  type Requests = PromisifyRequests<T>
  type RequestMethods = keyof Requests

  const log = (typeof options.log === 'function') ? options.log : createLogger()

  // TODO: add logger
  const { send, detach } = network(route, options)
  // TODO: add logger
  const tasks = jobQueue(options)
  const { on, expose, handle } = createHandler(log)

  /* send message, not expecting a response */
  function sendNotification (method: NotifyMethods, params?: any) {
    send({ method: <string>method, params })
  }

  /* send message that expects a response */
  function sendRequest (method: RequestMethods, params, timeoutms = options.timeout) {
    type RV = ReturnType<T[RequestMethods]>
    return tasks.enqueue<RV>(id => send({ id, method: <string>method, params }), timeoutms)
  }

  function close () {
    detach() // detach from underlying communication
    tasks.cancel() // cancel all current jobs
  }
    
  const request = <Requests>new Proxy({}, {
    get(target, prop: string, receiver) {
      return (...params) => sendRequest(<any>prop, params)
    }
  })

  const notify = <Notifications>new Proxy({}, {
    get(target, prop: string, receiver) {
      return (...params) => sendNotification(<any>prop, params)
    }
  })

  /**
   *  Route incoming data
   * 
   *  The payload type can be derived from its keys
   *
   *  payload type  |  id | method | result | error |
   *  --------------+-----+--------+--------+-------|
   *  notification  |     |    ✓   |        |       |
   *  request       |  ✓  |    ✓   |        |       |
   *  response      |  ✓  |        |    ✓   |       |
   *  error         |  ✓  |        |        |   ✓   |
   *
   */
  function route (payload: Payload) {
    log('route', payload)
    const { id, method, params, result, error } = payload

    if (method !== undefined) {
      /// handle requests and notifications
      handle(method, params, (error, result) => {
        log('route.handle:', method, { id, error, result })
        try {
          if (id !== undefined) send({ id, error, result })
          else if (error !== undefined) throw error
        } catch (sendError) {
          throw sendError
        }
        // TODO: change to emit, callback or log
      })
    } else if (result !== undefined || error !== undefined) {
      /// handle response and error messages
      const err = error ? new RpcError(error) : undefined
      /* resolve / reject promise returned by @link{sendRequest} */
      tasks.dequeue(id, err, result)
    } else {
      /// invalid message
      log('INVALID Message:', payload)
      if (options.ignoreInvalidMessages) return
      const err: any = new Error('Invalid RPC message!')
      err.message = payload
      // TODO: change to emit, callback or log
      throw err
    }
  }

  return {
    on,
    expose,
    notify,
    sendNotification,
    request,
    sendRequest,
    close
  }
}
