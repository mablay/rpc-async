# RPC Async

Builds RPC context on top of a loosely coupled communication protocols.

Inspired by [dnode](https://www.npmjs.com/package/dnode), [jayson](https://www.npmjs.com/package/jayson), [jsonrpc](https://www.jsonrpc.org/specification) and manny more.

Features

* Bidirectional async RPC (as long as the base communication is bidirectional)
* custom message encoding
* NodeJS / Browser support
* Streaming

## Usage

### Inter process communication
`ipc-parent.js`
```js
import RPC from 'rpc-async'
```


## Protocol

### Message serialisation

This RPC protocol defines 4 different message types.

| Message type | Purpose
|---|---
| Notification | One way message without response
| Request | RPC request that expects the remote peer to respond with an answer
| Response | RPC response from remote peer in case of success
| Error | RCP error from the remote peer in case of failure


### Transport serialisation format (JSON example)

```mermaid
sequenceDiagram
  rect rgb(127, 127, 127)
    note over A,B: RPC Request (success)
    A->>+B: { id: 456, method: 'add', params: [3, 5] }
    B->>-A: { id: 456, result: 8 }
  end
  rect rgb(127, 127, 127)
    note over A,B: RPC Request (fail)
    A->>+B: { id: 456, method: 'add', params: { foo: 'bar' } }
    B->>-A: { id: 456, step: 'RemoteExecution', data: <Error> }
  end
  rect rgb(127, 127, 127)
    note over A,B: Notification
    A->>B: { method: 'greet', params: 'Hello world' }
  end
```

### RPC sub-steps


| Step | Description
|---|---
| LocalEncoding | RPC serialises the request for transport
| TransportRequest | request message is sent via communication layer
| RemoteDecoding | request message is parsed by the remote peer
| RemoteExecution | remote peer executes the requested procedure
| RemoteEncoding | remote peer serialises its response for transport
| TransportResponse | response message is sent via communication layer
| LocalDecoding | RPC decodes the received response message
| ResponseMapping | RPC resolves the promise associated with the response

RpcEx
In case of a cought exception during an RPC, the response message uses its *origin* property to reference the step in the protocol sequence that caused it.

```mermaid
sequenceDiagram
  actor A as local context
  participant B as Local RPC
  participant C as Local com
  participant D as Remote com
  participant E as Remote RPC
  actor F as Remote context
  A->>+B: rpc.request('add', [2, 3])
  note over B: LocalEncoding
  B->>B: create & map request ID, encode request
  note over B,D: TransportRequest (user code involved)
  B->>C: com.send(encodedRequest)
  B->>-A: responsePromise (unresolved)
  C-->>D: send data somehow
  D->>+E: rpc.route(encodedRequest)
  note over E: RemoteDecoding
  E->>E: decode encodedRequest
  note over E,F: RemoteExecution
  E->>+F: .add(2, 3)
  F->>F: 2 + 3 = 5
  F->>-E: 5
  note over E: RemoteEncoding
  E->>E: encode response
  note over C,E: TransportResponse (user code involved)
  E->>-D: com.send(encodedResponse)
  D-->>C: send data somehow
  C->>B: rpc.route(encodedResponse)
  note over B: LocalDecoding
  B->>B: decode encodedResponse
  note over B: ResponseMapping
  B->>A: resolve responsePromise

```