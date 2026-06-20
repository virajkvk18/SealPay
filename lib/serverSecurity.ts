import { NextResponse } from "next/server";

const DEFAULT_JSON_BODY_LIMIT_BYTES = 32_000;
const DEFAULT_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function logApiSecurityEvent(
  event: string,
  request: Request,
  details: Record<string, string | number | boolean> = {},
) {
  const url = new URL(request.url);
  console.warn(
    JSON.stringify({
      event,
      method: request.method,
      path: url.pathname,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "unknown",
      ...details,
    }),
  );
}

export function rejectUntrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const requestUrl = new URL(request.url);
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    logApiSecurityEvent("malformed_origin_blocked", request);
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  if (originUrl.origin === requestUrl.origin) return null;

  logApiSecurityEvent("cross_origin_api_blocked", request, {
    origin: originUrl.origin,
  });

  return NextResponse.json(
    { error: "Cross-origin requests are not allowed." },
    { status: 403 },
  );
}

export function rejectOversizedBody(
  request: Request,
  limitBytes = DEFAULT_JSON_BODY_LIMIT_BYTES,
) {
  const rawLength = request.headers.get("content-length");
  const contentLength = rawLength ? Number(rawLength) : 0;

  if (Number.isFinite(contentLength) && contentLength > limitBytes) {
    logApiSecurityEvent("oversized_request_blocked", request, {
      contentLength,
      limitBytes,
    });

    return NextResponse.json(
      { error: "Request body is too large." },
      { status: 413 },
    );
  }

  return null;
}

export function getUploadLimitBytes() {
  const configured = Number(process.env.SECURITY_UPLOAD_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_UPLOAD_LIMIT_BYTES;
}

export function truncateText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

export function isValidDealId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
}

export function providerErrorDetails(details: string) {
  if (process.env.NODE_ENV === "production") {
    return "Provider request failed. Check server logs for details.";
  }

  return details.slice(0, 2_000);
}
