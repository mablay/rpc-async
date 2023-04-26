import { IAlice } from './types'

export class Alice implements IAlice {

  /**
   * does not return anything
   * => can be used as notification
   */
  async log (line: string) {
    console.log('[Alice.log] line:', line)
  }
  
  /** returns a result => use as request */
  async add (a: number, b: number) {
    return a + b
  }
}