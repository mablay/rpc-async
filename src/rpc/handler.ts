import { getMethods } from "./util.js"
import type { Callback, Logger, Procedure } from "./types"

export function createHandler (log: Logger) {

  const handler: Record<string, Function> = {}

  /** register local handler for incomming messages */
  function on (method: string, fn: Procedure ) {
    handler[method] = async (params: any[], cb?: Callback) => {
      // log('$$hander', method, params)
      if (typeof cb !== 'function') {
        // Handle notification
        try {
          fn(...params)
        } catch (error) {
          console.error(`[rpc-async] method "${method}" caused:`, error)
        }
        return
      }

      // Respond to request
      try {
        const result = await fn(...params)
        cb(undefined, result)
      } catch (error: any) {
        cb(error)
      }
    }
  }
  
  /**
   * Exposes a target objects own methods to RPC clients.
   * This is a convenience function for {@link handle}.
   * 
   * ❗️ Prototype methods will not be exposed for security reasons.
   * So, you can't expose inherited class members. If you want that,
   * either build your custom wrapper object or use {@link handle}.
   **/
  function expose<T> (target: T, exposeClass?: any) {
    let depth = 1
    if (exposeClass && target instanceof exposeClass) {
      depth = 2
    }
    const methods = getMethods(target, depth) // Object.getOwnPropertyNames(target)
    log('expose target:', target)
    for (const method of methods) {
      if (typeof target[method] !== 'function') continue
      log('expose', target?.constructor?.name, method)
      on(method, target[method].bind(target))
    }
  }

  /** invoked during routing of messages with a method */
  function handle (method: string, params: any, cb: Callback) {
    const fn = handler[method]
    if (typeof fn !== 'function') {
      cb(new Error(`No RPC handler for method "${method}"!`))
    }
    fn(params, cb)
  }

  return { on, expose, handle }
}
