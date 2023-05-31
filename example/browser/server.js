import { webSocketRpc } from './public/rpc.js'

import express from 'express'
import { readFileSync } from 'fs'
const app = express()
import expressWs from 'express-ws'

expressWs(app)

app.use(express.static('public'))

app.get('/rpc.js', function(req, res, next){
  const file = readFileSync('../../index.js')
  console.log('serve: rpc.js')
  res.end(file)
})

// @ts-ignore
app.ws('/ws', function(ws, req) {
  console.log('new WS connection', req.testing)
  const client = webSocketRpc(ws)
  client.wrap({
    log: console.log,
    add: (a, b) => Promise.resolve(a + b)
  })
})

app.listen(3000)