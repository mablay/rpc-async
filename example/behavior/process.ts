import { EventEmitter } from "@occami/events"

export class IpcPeer extends EventEmitter {

  /** NOTIFICATION: print message to console */
  async log (line: string) {
    console.log(`[${process.pid}:log]`, line)
  }

  /** NOTIFICATION: kill process */
  async ready () {
    this.emit('ready')
  }

  /** NOTIFICATION: kill process */
  async exit () {
    console.log(`[${process.pid}:exit]`)
    process.exit()
  }
  
  /** REQUEST: add two numbers */
  async add (a: number, b: number) {
    return a + b
  }

  async put (data: Record<string, string>) {
    return Object.keys(data)
  }
}

// export type Peer = typeof IpcPeer
