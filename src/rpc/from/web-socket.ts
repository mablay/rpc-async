import { createRpc } from '../../index.js'
import type NodeWebSocket from 'ws'
import type { Codec, Handler } from '../types'

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
 * If you're using it on a browser WebSocket, the WebSocket binaryType will be set to 'arraybuffer'.
 * 
 * JSON will be used as default codec unless you provide another.
 */
export function rpcFromWebSocket<RemoteHandler extends Handler> (ws: WebSocket | NodeWebSocket, codec?: Codec) {
    const node = typeof process !== 'undefined' && !!process?.versions?.node
    const binaryType = node ? 'nodebuffer' : 'arraybuffer'
    const convert = node
    ? (buffer: Buffer) => buffer
    : (arrayBuffer: ArrayBuffer) => {
        // TODO: this should be decided when the convert function is created
        //       not during its runtime.
        //       double check implementations for npm:ws and browser:WebSocket
        return typeof arrayBuffer === 'string' ? arrayBuffer : new Uint8Array(arrayBuffer)
      }

    (<any>ws).binaryType = binaryType
    return createRpc<RemoteHandler>({
      send: msg => ws.send(msg),
      attach: route => {
        const $route = (msg: any) => route(convert(msg.data))
        ws.addEventListener('message', $route)
        return () => ws.removeEventListener('message', $route)
      },
      encode: codec ? codec.encode : x => JSON.stringify(x),
      decode: codec ? codec.decode : x => JSON.parse(x)
    })
  }
