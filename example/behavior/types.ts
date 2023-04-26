export interface IAlice {
  log: (line: string) => Promise<void>
  add: (a: number, b: number) => Promise<number>
}

export interface IBob<T> {
  put: (key: string, obj: T) => Promise<void>
  get: (key: string) => Promise<T>
  clear: () => Promise<void>
}