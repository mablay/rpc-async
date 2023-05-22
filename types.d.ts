namespace RPC {
  /** unpromisify methods that return void or Promise<void> */
  type PickNotifications<T extends Record<string, any>> = {
    [
      P in keyof T as T[P] extends Function
      ? ReturnType<T[P]> extends Promise<void> | void ? P : never
      : never
    ]: ReturnType<T[P]> extends Promise<any>
        ? (...args: Parameters<T[P]>) => void
        : T[P]
  }

  /** promisify methods that don't return void or Promise<void> */
  type PromisifyRequests<T extends Record<string, any>> = {
    [
      P in keyof T as T[P] extends Function
      ? ReturnType<T[P]> extends Promise
        ? Awaited<ReturnType<T[P]>> extends void ? never : P
        : ReturnType<T[P]> extends void ? never : P
      : never
    ]: ReturnType<T[P]> extends Promise<any>
      ? T[P]
      : (...args: Parameters<T[P]>) => Promise<ReturnType<T[P]>>
  }

  interface Codec {
    encode: (input: any) => any
    decode: (output: any) => any
  }

  type SendFn = (data: any) => any
  type DetatchFn = () => void
  type Callback = (err?: any, value?: any) => void
  type IRpc = Record<string, any> 


  interface RpcOptions extends Partial<Codec> {
    send: SendFn
    /** if it returns a function, this function is used to disconnect from the underlying connection */
    attach: (route: any) => DetatchFn | void
    idgen?: () => any
    encode?: (input: any) => any
    decode?: (output: any) => any
    /** request timeout in milliseconds  */
    timeout?: number
    handler?: Record<string, Function> // (...args: any[]) => any
    ignoreInvalidMessages?: boolean
  }

  interface Payload {
    id?: any
    method?: string
    params?: any
    result?: any
    error?: any
  }

  interface ResponseMapValue {
    cb: Callback
    timeout: ReturnType<typeof setTimeout> // because NodeJS !== Browser
  }

  // type Handler = Record<string, (...args: any) => any>
  type Handler = Record<string, any>

}
