export type KitchenSink = {
  push: () => void
  pushPromise: () => Promise<void>
  pushArgs: (a: number, b: Buffer|Uint8Array) => void
  pushArgsPromise: (a: number, b: string) => Promise<void>
  pushUnimplemented?: () => void
  pushUnimplementedPromise?: () => Promise<void>
  pull: () => boolean
  pullPromise: () => Promise<boolean>
  pullArgs: (a: number, b: Buffer|Uint8Array) => number
  pullTimeout: () => any
  pullUninmplemented?: () => number
  pullUninmplementedPromise?: () => number
}

export const createKitchenSink = () => ({

})