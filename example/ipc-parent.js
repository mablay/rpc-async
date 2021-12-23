import { Rpc } from '../index.js'
import { fork } from 'child_process'
const child = fork('./example/ipc-child.js')
const rpc = Rpc.fromIpcProcess(child)
rpc.handle('add', ([a, b]) => a + b) // also works with async functions
