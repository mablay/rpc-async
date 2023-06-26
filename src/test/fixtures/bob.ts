export type IBob = {
  put: (item: any) => Promise<string>
  get: (key: string) => Promise<any>
  close: () => void
}

export class Bob implements IBob {
  store:Record<string, any> = {}
  put (item: any) {
    const key = Date.now().toString(36)
    this.store[key] = item
    return Promise.resolve(key)
  }
  get (key: string) {
    return Promise.resolve(this.store[key])
  }
  close () {}
}
