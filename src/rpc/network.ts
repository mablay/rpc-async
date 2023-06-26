import type { Codec, DetatchFn, Payload, SendFn } from './types'

export type Route = (payload: Payload) => void

export interface NetworkOptions extends Partial<Codec> {
  send: SendFn
  attach: (route: any) => DetatchFn | void
}

export function network (route: Route, options: NetworkOptions) {
  // const log = (typeof options.log === 'function') ? options.log : createLogger()
  const encode = (typeof options.encode === 'function') ? options.encode : (x:any) => x
  const decode = (typeof options.decode === 'function') ? options.decode : (x:any) => x

  return {
    send: (payload: Payload) => options.send(encode(payload)),
    detach: options.attach((payload: any) => route(decode(payload))) || (() => {})
  }
}