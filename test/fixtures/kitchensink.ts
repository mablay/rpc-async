export type KitchenSink = {
  push: () => void
  pushPromise: () => Promise<void>
  pushArgs: (a: number, b: Buffer|Uint8Array) => void
  pushArgsPromise: (a: number, b: string) => Promise<void>
  pushUnimplemented?: () => void
  pushUnimplementedPromise?: () => Promise<void>
  pull: () => boolean
  pullPromise: () => Promise<boolean>
  pullArgs: (a: number, b: number) => number
  pullTimeout: () => any
  pullUninmplemented?: () => number
  pullUninmplementedPromise?: () => number
}

export const createKitchenSink = ():KitchenSink => ({
  pullArgs: (a: number, b: number) => {
    console.log('[kitchensink] pullArgs', { a, b })
    return a + b
  }
})
