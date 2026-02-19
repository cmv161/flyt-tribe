import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type RequestContext = {
  requestId: string;
  correlationId: string;
  requestPath: string;
  requestMethod: string;
  requestIp: string | null;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

function readTrustProxyHeaders(): boolean {
  const rawValue = process.env.TRUST_PROXY_HEADERS?.trim().toLowerCase();

  if (!rawValue) {
    return false;
  }

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  throw new Error("TRUST_PROXY_HEADERS must be 'true' or 'false'");
}

const TRUST_PROXY_HEADERS = readTrustProxyHeaders();

function getRequestIp(request: Request): string | null {
  if (!TRUST_PROXY_HEADERS) {
    return null;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstProxyIp = forwardedFor.split(",")[0]?.trim();
    if (firstProxyIp) {
      return firstProxyIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

const REQUEST_ID_MAX_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;

function normalizeHeaderId(value: string | null): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > REQUEST_ID_MAX_LENGTH) {
    return null;
  }

  if (!REQUEST_ID_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function getHeaderId(request: Request, headerName: string): string | null {
  return normalizeHeaderId(request.headers.get(headerName));
}

export function createRequestContext(request: Request): RequestContext {
  const requestId = getHeaderId(request, "x-request-id") ?? randomUUID();
  const correlationId = getHeaderId(request, "x-correlation-id") ?? requestId;

  return {
    requestId,
    correlationId,
    requestPath: new URL(request.url).pathname,
    requestMethod: request.method.toUpperCase(),
    requestIp: getRequestIp(request),
  };
}

export function getRequestContext(): RequestContext | null {
  return requestContextStorage.getStore() ?? null;
}

export async function runWithRequestContext<T>(
  request: Request,
  handler: (context: RequestContext) => Promise<T>,
): Promise<T> {
  const context = createRequestContext(request);

  return requestContextStorage.run(context, () => handler(context));
}
