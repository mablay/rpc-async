// RPC between NodeJS and a browser communicating via websockets

import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createWebServer (onSocket, port = 9090) {
  const server = createServer(function (req, res) {
    const route = {
      '/': { path: 'index.html', type: 'text/html;' },
      '/client.js': { path: 'client.js', type: 'application/javascript;' },
      '/rpc-async.js': { path: '../../index.js', type: 'application/javascript;' },
      '/@occami/events': { path: '../../node_modules/@occami/events/index.js', type: 'application/javascript;' }
    }
    const asset = route[req.url]
    console.log('url:', req.url)
    if (req.url === '/ws') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('okay')
      return
    }
    if (!asset) return (res.writeHead(404) && res.end())
    const file = readFileSync(join(__dirname, asset.path))
    res.writeHead(200, { 'Content-Type': asset.type })
    res.end(file)
  }).listen(port)
  
  const wss = new WebSocketServer({ server })
  wss.on('connection', async function connection(socket, req) {
    console.log('connection', req.socket.remoteAddress)
    onSocket(socket)
  })  
}
