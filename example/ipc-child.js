import { Rpc } from '../index.js'
// class RpcRemoteEncodingError extends Error {}
process.name = 'CHILD '
const log = (...args) => console.log(process.name, '| main |', ...args)

const rpc = Rpc.fromIpcProcess(process)
main().catch(log)

async function main () {

  // setup RPC handler
  rpc.handle('greet', greet)

  // program
  await remoteCalculation()
  rpc.notify('done')
}

async function remoteCalculation () {
  const [a, b] = [3, 2]
  await rpc.request('add', [a, b])
    .then(sum => log('received:', a, '+', b, '=', sum))
    .catch(error => log(error.message))
}

function greet (subject) {
  log('execute "greet"')
  return `Hello ${subject}!`
}