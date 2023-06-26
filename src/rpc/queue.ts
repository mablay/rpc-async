/*
 * Enqueue tasks with callbacks that can timeout
 */
import defaultIdGenerator from './plugins/id-generator'
import type { Callback, Logger } from "./types"

type Timeout = ReturnType<typeof setTimeout>

export interface Job {
  timeout: Timeout
  callback: Callback
}

export interface JobQueueOptions {
  /** Default job timeout in milliseconds. Default: 30000 */
  defaultTimeout?: number
  /** Custom unique ID generating function */
  createId?: () => string
  /** Optional log function for debuging */
  log?: Logger
}

/** Enqueue jobs with callbacks, handle timeout */
export function jobQueue (options: JobQueueOptions = {}) {
  const defaultTimeout = options.defaultTimeout ?? 30000
  const createId = options.createId ?? defaultIdGenerator

  /** job Map */
  const queue: Record<string, Job> = {}

  /** 
   * enqueue a job with optional custom timeout
   * @param ms millesconds until callback is invoked with TimoutException
   * @returns job ID
  **/
  function enqueue<T> (useId: (id: string) => void, ms = defaultTimeout) {
    return new Promise<T>((resolve, reject) => {
      const id = createId()
      const callback = (error: any, result?: T) => error ? reject(error) : resolve(<T>result)
      queue[id] = {
        callback,
        timeout: setTimeout(() => {
          callback(new Error(`RpcAsync job "${id}" timed out!`))
          delete queue[id]
        }, ms)
      }
      useId(id)
    })
  }

  /** dequeue a job, canceling it's timeout */
  function dequeue (id: string, error: any, value: any) {
    const job = queue[id]
    if (!job) return undefined
    // TODO: proper error handling
    // if (job === undefined) {
    //   log(`Ignoring RPC response with unknown id: "${id}"!`)
    //   return
    // }
    clearTimeout(job.timeout)
    job.callback(error, value)
    delete queue[id]
  }

  /* cancel all scheduled jobs */
  function cancel () {
    for (const { callback } of Object.values(queue)) {
      callback(new Error('RpcClosing'))
    }
  }  

  return { enqueue, dequeue, cancel }
}