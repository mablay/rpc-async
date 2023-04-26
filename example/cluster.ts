import cluster from 'node:cluster'
import { Rpc } from '..'
import { Alice } from './behavior/alice'
import { Bob } from './behavior/bob'

if (cluster.isPrimary) {
  console.log(`[Primary] ${process.pid} is running`)
  const worker = cluster.fork({ execPath: 'tsx' })
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Primary] worker ${worker.process.pid} died`)
  })

  const local = new Alice()
  const remote = Rpc.fromIpcProcess(worker)
  // remote.handle()
} else {
  console.log(`[Worker] ${process.pid} started`)
  const local = new Bob()
  const remote = Rpc.fromIpcProcess(process)

}