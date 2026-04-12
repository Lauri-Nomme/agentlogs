import { createLogger } from "@agentlogs/shared";

// Patch: Extend logger with context helpers for requestId propagation (see docs/server-logging-improvements.md)
export interface LoggerWithContext {
  debug: (msg: string, meta?: any, ctx?: { requestId?: string }) => void;
  info: (msg: string, meta?: any, ctx?: { requestId?: string }) => void;
  warn: (msg: string, meta?: any, ctx?: { requestId?: string }) => void;
  error: (msg: string, meta?: any, ctx?: { requestId?: string }) => void;
}

const baseLogger = createLogger("server");

function withContextLevelFn(
  fn: (msg: string, meta?: any) => void,
): (msg: string, meta?: any, ctx?: { requestId?: string }) => void {
  return (msg, meta, ctx) => {
    if (ctx?.requestId) {
      fn(`${msg} [req:${ctx.requestId}]`, meta);
    } else {
      fn(msg, meta);
    }
  };
}

export const logger: LoggerWithContext = {
  debug: withContextLevelFn(baseLogger.debug),
  info: withContextLevelFn(baseLogger.info),
  warn: withContextLevelFn(baseLogger.warn),
  error: withContextLevelFn(baseLogger.error),
};
