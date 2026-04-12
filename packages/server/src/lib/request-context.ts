// request-context.ts
// Utilities for request correlation/trace context propagation
import { randomUUID } from "crypto";

export interface RequestContext {
  requestId: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Reads or generates a request/correlation ID from headers or generates a new one if missing.
 * Attach as early as possible in any API handler.
 */
export function getRequestContext(request: Request, userId?: string): RequestContext {
  const headerId = request.headers.get("x-request-id");
  const requestId = headerId && headerId.length > 0 ? headerId : randomUUID();
  return { requestId, userId };
}
