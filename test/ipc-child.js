import { Rpc } from '../index.js'
const rpc = Rpc.fromIpcProcess(process)
rpc.notify('foo', 'bar')