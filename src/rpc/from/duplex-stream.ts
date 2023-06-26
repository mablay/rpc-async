import { createInterface } from 'node:readline'
import { Duplex } from 'stream'
import { EOL } from 'node:os'
import { createRpc } from '../../index.js'
import type { Codec, Handler } from '../types'

/**
 * Using line delimited JSON messages.
 * This will only work, if write access is exclusive! */
export function rpcFromStream<T extends Handler> (stream: Duplex, codec?: Codec) {
  const { encode, decode } = codec ?? {
    encode: data => JSON.stringify(data).concat(EOL),
    decode: data => JSON.parse(data)
  }
  return createRpc<T>({
    send: (data: string|Buffer) => stream.write(data),
    attach: (route) => {
      const readline = createInterface({ input: stream })
      readline.on('line', data => route(data))
      return () => readline.close()
    },
    encode,
    decode
  })
}
