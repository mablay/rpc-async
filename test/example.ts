import { createRpc } from '..'

interface Remote extends RPC.Handler {
  /** REQUEST but with promisified call signature */
  add: (a: number, b: number) => number
  /** REQUEST, since it returns a non void promise */
  write: (path: string, buffer: Buffer) => Promise<undefined>
  /** REQUEST but with promisified call signature */
  read: (path: string) => Promise<Buffer>
  /** NOTIFICATION, since it returns a void promise */
  log: (msg: string) => Promise<void>
  /** NOTIFICATION, since it returns void */
  close: () => void
  /** will be ignored, since it's not a function */
  // foo: number
}

const r = createRpc<Remote>({
  send: () => {},
  attach: () => {},
  handler: {
    md5: (text: string) => 'xyz'
  }
})

// check r.notify and r.request methods for autocompletion
r.notify.log('foo')