export function getMethods (obj, i = 1) {
  if (!obj || !i) return []
  return getMethods(Object.getPrototypeOf(obj), --i).concat(
    Object.getOwnPropertyNames(obj)
      .map(method => typeof obj[method] === 'function' ? method : null)
      .filter(x => x)
  )
}

export function getSafeMethods (obj: any, constructor?: any) {
  if (constructor !== undefined && obj instanceof constructor) {
    return getSafeMethods(Object.getPrototypeOf(obj), constructor)
      .concat(getObjectMembers(obj))
  }
  return getObjectMembers(obj)
}

export function getObjectMembers (obj: any) {
  if (obj === undefined) return []
  return Object.getOwnPropertyNames(obj)
    .filter(method => typeof obj[method] === 'function' && method !== 'constructor')
}

// TODO: Opaque error messages by default, opt in for remote stack during development.
export class RpcError extends Error {
  constructor ({ name, message }) {
    super(`${name}: ${message} (remote stack)`)
  }
}
