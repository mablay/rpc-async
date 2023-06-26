/** unpromisify methods that return void or Promise<void> */
export type PickNotifications<T extends Record<string, any>> = {
  [
    P in keyof T as T[P] extends Function
    ? ReturnType<T[P]> extends Promise<void> | void ? P : never
    : never
  ]: ReturnType<T[P]> extends Promise<any>
      ? (...args: Parameters<T[P]>) => void
      : T[P]
}

/** promisify methods that don't return void or Promise<void> */
export type PromisifyRequests<T extends Record<string, any>> = {
  [
    P in keyof T as T[P] extends Function
    ? ReturnType<T[P]> extends Promise<P>
      ? Awaited<ReturnType<T[P]>> extends void ? never : P
      : ReturnType<T[P]> extends void ? never : P
    : never
  ]: ReturnType<T[P]> extends Promise<any>
    ? T[P]
    : (...args: Parameters<T[P]>) => Promise<ReturnType<T[P]>>
}

export interface Codec {
  encode: (input: any) => any
  decode: (output: any) => any
}

export type Procedure = (...args:any[]) => any
export type Logger = (...args:any[]) => void
export type SendFn = (data: any) => any
export type DetatchFn = () => void
export type Callback = (err?: any, value?: any) => void
export type IRpc = Record<string, any> 


export interface RpcOptions extends Partial<Codec> {
  send: SendFn
  /** if it returns a function, this function is used to disconnect from the underlying connection */
  attach: (route: any) => DetatchFn | void
  createId?: () => any
  encode?: (input: any) => any
  decode?: (output: any) => any
  log?: (...args: any[]) => void
  /** request timeout in milliseconds  */
  timeout?: number
  handler?: Record<string, Function> // (...args: any[]) => any
  ignoreInvalidMessages?: boolean
}

export interface NotificationPayload {
  method: string
  params: any
}

export interface RequestPayload {
  id: any
  method: string
  params: any
}

export interface ResultPayload {
  id: any
  result: any
}

export interface ErrorPayload {
  id: any
  error: any
}

export interface Payload {
  id?: any
  method?: string
  params?: any
  result?: any
  error?: any
}

export interface ResponseMapValue {
  cb: Callback
  timeout: ReturnType<typeof setTimeout> // because NodeJS !== Browser
}

// type Handler = Record<string, (...args: any) => any>
export type Handler = Record<string, any>