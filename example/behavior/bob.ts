import { IBob } from './types'

export class Bob<T> implements IBob<T> {
  #store = new Map<string, T>()

  async put (key: string, obj: T) {
    this.#store.set(key, obj)
  }
  async get (key: string) {
    const obj = this.#store.get(key)
    if (obj !== undefined) return obj
    throw new Error(`Could not find value for key: "${key}"!`)
  }
  async clear () {
    this.#store.clear()
  }
}