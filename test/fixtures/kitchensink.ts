export type KitchenSink = {
  // --- notifications --- //
  push: () => void
  pushPromise: () => Promise<void>
  pushArgs: (a: number, b: Buffer|Uint8Array) => void
  pushArgsPromise: (a: number, b: string) => Promise<void>
  pushUnimplemented?: () => void
  pushUnimplementedPromise?: () => Promise<void>

  // --- requests --- //
  pull: () => boolean
  pullPromise: () => Promise<boolean>
  pullArgs: (a: number, b: number) => number
  pullTimeout: () => any
  pullUninmplemented?: () => number
  pullUninmplementedPromise?: () => number
}

export const createKitchenSink = ():KitchenSink => ({
  push () {
    console.log('KILL')
    if (typeof process !== 'undefined') {
      process?.exit()
    }
  },
  pullArgs: (a: number, b: number) => {
    console.log('[kitchensink] pullArgs', { a, b })
    return a + b
  }
})
