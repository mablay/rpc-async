export type IAlice = {
  increment: () => void
  count: () => number
}

export class Alice implements IAlice {
  counter = 0
  increment () {
    this.counter++
  }
  count () {
    return this.counter
  }
}
