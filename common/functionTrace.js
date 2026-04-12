"use strict";

const WRAPPED_FN = Symbol.for("mjs.functionTrace.wrapped");
const TRACE_ENABLED = (process.env.TRACE_ENABLED || "true").toLowerCase() !== "false";
const ARG_LIMIT = parseInt(process.env.TRACE_ARG_LIMIT || "400", 10);
const STACK_LINES = parseInt(process.env.TRACE_STACK_LINES || "8", 10);

const isPromiseLike = (value) =>
  value && typeof value.then === "function" && typeof value.catch === "function";

const safeStringify = (value) => {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, current) => {
    if (typeof current === "bigint") return `${current}n`;
    if (typeof current === "function") {
      return `[Function ${current.name || "anonymous"}]`;
    }
    if (current && typeof current === "object") {
      if (seen.has(current)) return "[Circular]";
      seen.add(current);
    }
    return current;
  });
};

const compactValue = (value, maxLen = ARG_LIMIT) => {
  try {
    const json = safeStringify(value);
    if (typeof json === "string") {
      if (json.length > maxLen) return `${json.slice(0, maxLen)}...`;
      return json;
    }
  } catch (_) {
    // ignore and fallback to String conversion
  }

  const text = String(value);
  if (text.length > maxLen) return `${text.slice(0, maxLen)}...`;
  return text;
};

const getCallerStack = () => {
  const stack = new Error().stack || "";
  return stack
    .split("\n")
    .slice(3, 3 + STACK_LINES)
    .join("\n");
};

const logEnter = (label, args) => {
  console.log(`[TRACE][ENTER] ${label}`);
  console.log(`[TRACE][ARGS] ${label}: ${compactValue(args.map(summarizeArg))}`);
};

const logExit = (label, startedAt) => {
  const elapsed = Date.now() - startedAt;
  console.log(`[TRACE][EXIT] ${label} (${elapsed}ms)`);
};

const logError = (label, startedAt, callerStack, error) => {
  const elapsed = Date.now() - startedAt;
  console.error(`[TRACE][ERROR] ${label} (${elapsed}ms)`);
  if (error && error.stack) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
  if (callerStack) {
    console.error(`[TRACE][CALLER] ${label}\n${callerStack}`);
  }
};

const wrapFunction = (fn, label) => {
  if (typeof fn !== "function") return fn;
  if (!TRACE_ENABLED) return fn;
  if (fn[WRAPPED_FN]) return fn;

  const wrapped = function tracedFunction(...args) {
    const startedAt = Date.now();
    const callerStack = getCallerStack();
    logEnter(label, args);

    try {
      const result = fn.apply(this, args);
      if (isPromiseLike(result)) {
        return result
          .then((resolved) => {
            logExit(label, startedAt);
            return resolved;
          })
          .catch((error) => {
            logError(label, startedAt, callerStack, error);
            throw error;
          });
      }

      logExit(label, startedAt);
      return result;
    } catch (error) {
      logError(label, startedAt, callerStack, error);
      throw error;
    }
  };

  Object.defineProperty(wrapped, WRAPPED_FN, {
    enumerable: false,
    configurable: false,
    writable: false,
    value: true,
  });

  return wrapped;
};

const summarizeArg = (arg) => {
  if (!arg) return arg;

  if (typeof arg === "function") {
    return `[Function ${arg.name || "anonymous"}]`;
  }

  if (arg && typeof arg === "object") {
    if (arg.method && (arg.originalUrl || arg.url) && arg.headers) {
      return {
        type: "request",
        method: arg.method,
        url: arg.originalUrl || arg.url,
        params: arg.params || {},
        query: arg.query || {},
        body: arg.body || {},
      };
    }

    if (typeof arg.status === "function" && typeof arg.send === "function") {
      return {
        type: "response",
        statusCode: arg.statusCode,
      };
    }
  }

  return arg;
};

const traceAny = (value, label = "anonymous") => {
  if (typeof value === "function") {
    return wrapFunction(value, label);
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = traceAny(value[i], `${label}[${i}]`);
    }
    return value;
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = traceAny(value[key], `${label}.${key}`);
    }
    return value;
  }

  return value;
};

module.exports = {
  traceAny,
  wrapFunction,
};
