function detectEnv() {
    // if (typeof window !== undefined && window?.name)
    if (typeof process !== 'undefined' && process?.pid && process?.env) {
        return {
            name: `PID:${process.pid}`,
            debug: !!process.env.DEBUG_RPC
        };
    }
    else if (typeof window !== 'undefined') {
        return {
            name: 'MAIN',
            debug: !!window.DEBUG_RPC
        };
    }
    else if (typeof self !== 'undefined') {
        return {
            name: 'WORKER',
            debug: !!self.DEBUG_RPC
        };
    }
    return {
        name: 'UNDEFINED',
        debug: false
    };
}
export function createLogger() {
    const { name, debug } = detectEnv();
    if (debug) {
        return (...args) => console.log('[RPC', Date.now(), `${name}]`, ...args);
    }
    return () => { };
}
//# sourceMappingURL=log.js.map