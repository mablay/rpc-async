import test from 'node:test'
import assert from 'node:assert'
import { getMethods, getObjectMembers, getSafeMethods } from '../rpc/util'

class Foo { b () {} }
class Bar extends Foo { c () {} }

test('getMethods', async t => {
  await t.test('get POJO methods', t => {
    const obj = { a: () => 1 }
    const methods = getSafeMethods(obj)
    assert.deepEqual(methods, ['a'])
  })

  await t.test('get class methods', t => {
    const obj = new Foo()
    const methods = getSafeMethods(obj, Foo)
    assert.deepEqual(methods, ['b'])
  })

  await t.test('get parent class methods', t => {
    const obj = new Bar()
    assert.deepEqual(getSafeMethods(obj), [])
    assert.deepEqual(getSafeMethods(obj, Bar), ['c'])
    assert.deepEqual(getSafeMethods(obj, Foo), ['b', 'c'])
  })
  
})

function explore (obj) {
  if (obj?.constructor === undefined) {
    return []
  }
  return [{
    name: Object.getOwnPropertyDescriptor(obj, 'constructor')?.value?.name
    // name: obj.constructor.name,
    // cvOF: obj.constructor.valueOf(),
    // ctor: obj.valueOf(),
    // ctorProps: getAllProps(obj),
    // props: getSafeMethods(obj)
  }].concat(explore(Object.getPrototypeOf(obj)))
}

function getAllProps (obj: any) {
  return {
    des: Object.getOwnPropertyDescriptors(obj),
    sym: Object.getOwnPropertySymbols(obj),
    prop: Object.getOwnPropertyNames(obj)
  }
}