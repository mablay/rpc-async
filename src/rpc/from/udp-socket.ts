import { Socket } from "dgram"
import { createRpc } from "../../index.js"
import type { Handler } from "../types"

export function rpcFromUdp<T extends Handler>(socket: Socket, port?: number) {
  return createRpc<T>({
    send: (msg: any) => socket.send(msg, port),
    attach: (route) => {
      socket.on('message', route)
      return () => socket.removeListener('message', route)
    },
    encode: (obj: any) => JSON.stringify(obj),
    decode: (buffer: string) => JSON.parse(buffer)
  })
}