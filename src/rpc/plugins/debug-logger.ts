/* 
 * Troubleshooting rpc-async? Activate debug logs.
 * 
 * Before your RPC instances are created, set:
 * 
 * NodeJS: process.env.DEBUG_RPC = 1
 * Browser: window.DEBUG_RPC = 1
 */

type Env = {
  name: string
  debug: boolean
}

function detectEnv ():Env {
  // if (typeof window !== undefined && window?.name)
  if (typeof process !== 'undefined' && process?.pid && process?.env) {
    return {
      name: `PID:${process.pid}`,
      debug: !!process.env.DEBUG_RPC
    }
  } else if (typeof window !== 'undefined') {
    return {
      name: 'MAIN',
      debug: !!(<any>window).DEBUG_RPC
    }
  } else if (typeof self !== 'undefined') {
    return {
      name: 'WORKER',
      debug: !!(<any>self).DEBUG_RPC
    }
  }
  return {
    name: 'UNDEFINED',
    debug: false
  }
}

export function createLogger () {
  const { name, debug } = detectEnv()
  if (debug) {
    return (...args: any[]) => console.log('[RPC', new Date().toJSON(), `${name}]`, ...args)
  }
  return () => {}
}