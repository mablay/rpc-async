// node_modules/@occami/events/index.js
var EventEmitter = class {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  addListener(eventName, listener) {
    this.emit("newListener", eventName, listener);
    const listeners = this.listeners.get(eventName) || [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
    return this;
  }
  on(eventName, listener) {
    return this.addListener(eventName, listener);
  }
  once(eventName, listener) {
    const listeners = this.listeners.get(eventName) || [];
    const fn = (...args) => {
      this.removeListener(eventName, fn);
      listener(...args);
    };
    fn.$onceFn = listener;
    listeners.push(fn);
    this.listeners.set(eventName, listeners);
    return this;
  }
  emit(eventName, ...args) {
    const listeners = this.listeners.get(eventName) || [];
    for (const listener of listeners.slice()) {
      listener(...args);
    }
    return listeners.length > 0;
  }
  removeListener(eventName, listener) {
    const listeners = this.listeners.get(eventName) || [];
    const index = listeners.findIndex((fn) => fn === listener || fn.$onceFn === listener);
    if (~index)
      listeners.splice(index, 1);
    if (listeners.length === 0)
      this.listeners.delete(eventName);
    this.emit("removeListener", eventName, listener);
    return this;
  }
  off(eventName, listener) {
    return this.removeListener(eventName, listener);
  }
  removeAllListeners(eventName) {
    const listeners = this.listeners.get(eventName) || [];
    for (const listener of listeners.slice()) {
      this.removeListener(eventName, listener);
    }
    return this;
  }
  eventNames() {
    return [...this.listeners.keys()];
  }
  listenerCount(eventName) {
    const listeners = this.listeners.get(eventName) || [];
    return listeners.length;
  }
};

// src/id-gen.ts
var defaultIdGen = () => Math.random().toString(36).slice(2);

// src/log.ts
function detectEnv() {
  if (typeof process !== "undefined" && (process == null ? void 0 : process.pid) && (process == null ? void 0 : process.env)) {
    return {
      name: `PID:${process.pid}`,
      debug: !!process.env.DEBUG_RPC
    };
  } else if (typeof window !== "undefined") {
    return {
      name: "MAIN",
      debug: !!window.DEBUG_RPC
    };
  } else if (typeof self !== "undefined") {
    return {
      name: "WORKER",
      debug: !!self.DEBUG_RPC
    };
  }
  return {
    name: "UNDEFINED",
    debug: false
  };
}
function createLogger() {
  const { name, debug } = detectEnv();
  if (debug) {
    return (...args) => console.log("[RPC", Date.now(), `${name}]`, ...args);
  }
  return () => {
  };
}

// src/rpc.ts
var log = createLogger();
function createRpc(options) {
  var _a, _b;
  const timeout = (_a = options.timeout) != null ? _a : 3e4;
  const resMap = /* @__PURE__ */ new Map();
  const { send, attach } = options;
  const idgen = (_b = options.idgen) != null ? _b : defaultIdGen;
  const encode = typeof options.encode === "function" ? options.encode : (x) => x;
  const decode = typeof options.decode === "function" ? options.decode : (x) => x;
  const $send = (payload) => send(encode(payload));
  const detach = attach((payload) => route(decode(payload))) || (() => {
  });
  const emitter = new EventEmitter();
  function notify(method, params) {
    $send({ method, params });
  }
  function request(method, params, timeoutms = timeout) {
    return new Promise((resolve, reject) => {
      $request(method, params, timeoutms, (error, result) => {
        error ? reject(error) : resolve(result);
      });
    });
  }
  function $request(method, params, timeoutms, cb) {
    const id = idgen();
    log(`send: ${method}(${Array.isArray(params) ? params.join(", ") : ""}) with timeout:`, timeoutms);
    const timeout2 = setTimeout(() => {
      log(`timeout: "${method}"`);
      clearTimeout(timeout2);
      cb(new Error(`RpcAsync request "${method}" timed out!`));
    }, timeoutms);
    resMap.set(id, { cb, timeout: timeout2 });
    $send({ id, method, params });
  }
  function route(payload) {
    log("route", payload);
    const { id, method, params, result, error } = payload;
    if (result !== void 0 || error !== void 0) {
      const err = error ? new RpcError(error) : void 0;
      const req = resMap.get(id);
      if (req === void 0) {
        emitter.emit("response-unmapped-or-outdated");
        return;
      }
      resMap.delete(id);
      clearTimeout(req.timeout);
      req.cb(err, result);
    } else if (id && method) {
      log("request", method, params);
      if (emitter.listenerCount(method) === 0) {
        $send({ id, error: {
          name: "UNKNOWN_METHOD",
          message: `unknown method "${method}"!`
        } });
        return;
      }
      emitter.emit(method, params, (error2, result2) => {
        $send({ id, error: error2, result: result2 });
      });
    } else if (method) {
      emitter.emit(method, params);
    } else {
      if (options.ignoreInvalidMessages)
        return;
      const err = new Error("Invalid RPC message!");
      err.message = payload;
      throw err;
    }
  }
  function handle(method, fn) {
    emitter.on(method, async (params, cb) => {
      if (typeof cb !== "function") {
        fn(...params);
        return;
      }
      try {
        const result = await fn(...params);
        cb(void 0, result);
      } catch (error) {
        const { name, message, stack } = error;
        cb({ name, message, stack });
      }
    });
  }
  const proxyRequest = new Proxy({}, {
    get(target, prop, receiver) {
      return (...params) => request(prop, params);
    }
  });
  const proxyNotify = new Proxy({}, {
    get(target, prop, receiver) {
      return (...params) => notify(prop, params);
    }
  });
  function close() {
    for (const { cb } of resMap.values()) {
      cb("RpcClosing");
    }
    detach();
  }
  function wrap(proxy, depth = 1) {
    var _a2;
    const props = getMethods(proxy, depth);
    for (const prop of props) {
      if (typeof proxy[prop] !== "function")
        continue;
      log("wrap", (_a2 = proxy.constructor) == null ? void 0 : _a2.name, prop);
      handle(prop, proxy[prop].bind(proxy));
    }
    return rpc;
  }
  const rpc = {
    handle,
    wrap,
    notify: proxyNotify,
    request: proxyRequest,
    close,
    emitter
  };
  return rpc;
}
var RpcError = class extends Error {
  constructor({ name, message }) {
    super(`${name}: ${message} (remote stack)`);
  }
};
function getMethods(obj, i = 2) {
  if (!obj || !i)
    return [];
  return getMethods(Object.getPrototypeOf(obj), --i).concat(
    Object.getOwnPropertyNames(obj).map((method) => typeof obj[method] === "function" ? method : null).filter((x) => x)
  );
}

// src/from/event-emitter.ts
function eventEmittersRpc(local, remote) {
  return createRpc({
    send: (req) => remote.emit("rpc", req),
    attach: (route) => {
      local.on("rpc", route);
      return () => local.removeListener("rpc", route);
    }
  });
}

// src/from/event-target.ts
function eventTargetsRpc(a, b) {
  class CustomEvent extends Event {
    constructor(message, data) {
      super(message);
      this.detail = data;
    }
  }
  return createRpc({
    send: (data) => b.dispatchEvent(new CustomEvent("rpc", data)),
    attach: (route) => {
      const $route = (ev) => route(ev.detail);
      a.addEventListener("rpc", $route);
      return () => a.removeEventListener("rpc", $route);
    }
  });
}

// src/from/ipc-process.ts
var RPC_SYMBOL = "\u{1F308}";
function ipcProcessRpc(proc) {
  if (proc.send === void 0) {
    throw new Error("Process was not spawned with an IPC channel! Won't be able to use `process.send`!");
  }
  return createRpc({
    send: (req) => proc.send({ [RPC_SYMBOL]: req }),
    attach: (route) => {
      const $route = (msg) => msg[RPC_SYMBOL] && route(msg[RPC_SYMBOL]);
      proc.on("message", $route);
      return () => proc.removeListener("message", $route);
    },
    decode(x) {
      return x;
    },
    ignoreInvalidMessages: true
  });
}

// src/from/web-socket.ts
function webSocketRpc(ws, codec) {
  var _a;
  const node = typeof process !== "undefined" && !!((_a = process == null ? void 0 : process.versions) == null ? void 0 : _a.node);
  const binaryType = node ? "nodebuffer" : "arraybuffer";
  const convert = node ? (buffer) => buffer : (arrayBuffer) => {
    return typeof arrayBuffer === "string" ? arrayBuffer : new Uint8Array(arrayBuffer);
  };
  ws.binaryType = binaryType;
  return createRpc({
    send: (msg) => ws.send(msg),
    attach: (route) => {
      const $route = (msg) => route(convert(msg.data));
      ws.addEventListener("message", $route);
      return () => ws.removeEventListener("message", $route);
    },
    encode: codec ? codec.encode : (x) => JSON.stringify(x),
    decode: codec ? codec.decode : (x) => JSON.parse(x)
  });
}

// src/from/web-worker.ts
function webWorkerRpc(worker) {
  return createRpc({
    send: (data) => worker.postMessage(data),
    attach: (route) => {
      const $route = (event) => route(event.data);
      worker.addEventListener("message", $route);
      return () => worker.removeEventListener("message", $route);
    }
  });
}
export {
  createRpc,
  eventEmittersRpc,
  eventTargetsRpc,
  ipcProcessRpc,
  webSocketRpc,
  webWorkerRpc
};
