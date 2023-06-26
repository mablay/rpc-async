import { createRpc } from '../..'
import type { Handler } from '../types'

export function webWorkerRpc<T extends Handler> (worker: Worker) {
  return createRpc<T>({
    send: data => worker.postMessage(data),
    attach: route => {
      const $route = event => route(event.data)
      worker.addEventListener('message', $route)
      return () => worker.removeEventListener('message', $route)
    }
  })  
}
