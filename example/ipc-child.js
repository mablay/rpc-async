import { Rpc } from '../index.js'
const rpc = Rpc.fromIpcProcess(process)
rpc.request('add', [3, 5]).then(sum => {
  console.log('3 + 5 =', sum)
  rpc.close()
})