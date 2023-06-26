import { Socket } from "dgram"
import { Handler } from "../types"
import { createRpc } from "../router"

export function udpJsonRpc<T extends Handler>(socket: Socket, port?: number) {
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