#!/usr/bin/env tsx
import cluster from 'node:cluster'
import { ipcProcessRpc } from '..'
import { IpcPeer } from './behavior/process'

if (cluster.isPrimary) {
  console.log(`[Primary] ${process.pid} is running`)
  const worker = cluster.fork({ execPath: 'tsx' })
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Primary] worker ${worker.process.pid} died`)
  })

  const local = new IpcPeer()
  const remote = ipcProcessRpc<IpcPeer>(worker).wrap(local, 2)
  await new Promise(resolve => local.once('ready', resolve))
  const sum = await remote.request.add(3, 5)
  console.log('sum 3 + 5 =', sum)
  remote.notify.log('foo')
  const keys = await remote.request.put({ foo: 'bar', lorem: 'ipsum' })
  console.log('keys:', keys)
  // remote.notify.exit()
  worker.kill()
} else {
  console.log(`[Worker] ${process.pid} started`)
  const local = new IpcPeer()
  const remote = ipcProcessRpc<IpcPeer>(process) // .wrap(local)
  remote.handle('add', (a: number, b: number) => local.add(a, b))
  remote.handle('put', (data: any) => local.put(data))
  remote.handle('log', (line: string) => local.log(line))
  remote.handle('exit', () => local.exit())
  remote.notify.ready()
}