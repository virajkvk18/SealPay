import { NextRequest, NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_PAGE_LIMIT = 180;
const DEFAULT_API_LIMIT = 60;
const DEFAULT_SENSITIVE_LIMIT = 20;
const MAX_BUCKETS = 5_000;

const buckets = new Map<string, Bucket>();

function readPositiveInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function logSecurityEvent(
  event: string,
  request: NextRequest,
  details: Record<string, string | number> = {},
) {
  console.warn(
    JSON.stringify({
      event,
      method: request.method,
      path: request.nextUrl.pathname,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "unknown",
      ...details,
    }),
  );
}

function isSuspiciousPath(pathname: string) {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return true;
  }

  const lowered = decoded.toLowerCase();
  return (
    lowered.includes("..") ||
    lowered.includes("\\") ||
    lowered.includes("/.env") ||
    lowered.includes("/wp-admin") ||
    lowered.includes("/wp-login") ||
    lowered.endsWith(".php") ||
    lowered.endsWith(".bak") ||
    lowered.endsWith(".sql")
  );
}

function getRateLimitGroup(pathname: string) {
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/ai")) {
    return {
      limit: readPositiveInt("SECURITY_SENSITIVE_RATE_LIMIT", DEFAULT_SENSITIVE_LIMIT),
      name: "sensitive",
    };
  }

  if (pathname.startsWith("/api")) {
    return {
      limit: readPositiveInt("SECURITY_API_RATE_LIMIT", DEFAULT_API_LIMIT),
      name: "api",
    };
  }

  return {
    limit: readPositiveInt("SECURITY_PAGE_RATE_LIMIT", DEFAULT_PAGE_LIMIT),
    name: "page",
  };
}

function applyRateLimit(request: NextRequest) {
  if (process.env.SECURITY_RATE_LIMIT_DISABLED === "true") return null;

  const windowMs = readPositiveInt("SECURITY_RATE_LIMIT_WINDOW_MS", DEFAULT_WINDOW_MS);
  const now = Date.now();
  const { limit, name } = getRateLimitGroup(request.nextUrl.pathname);
  const key = `${getClientIp(request)}:${name}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  if (current.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  logSecurityEvent("rate_limit_exceeded", request, { group: name, retryAfter });

  return new NextResponse("Too many requests", {
    status: 429,
    headers: {
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(current.resetAt / 1000)),
    },
  });
}

function setSecurityHeaders(response: NextResponse, request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "img-src 'self' https: data: blob:",
      "connect-src 'self' https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
      "form-action 'self'",
      isProduction ? "upgrade-insecure-requests" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );

  if (isProduction && !isLocalHost(request.nextUrl.hostname)) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

export function proxy(request: NextRequest) {
  if (isSuspiciousPath(request.nextUrl.pathname)) {
    logSecurityEvent("suspicious_path_blocked", request);
    return new NextResponse("Not found", { status: 404 });
  }

  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http" &&
    !isLocalHost(request.nextUrl.hostname)
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    logSecurityEvent("https_redirect", request);
    return NextResponse.redirect(url, 308);
  }

  const rateLimited = applyRateLimit(request);
  if (rateLimited) {
    setSecurityHeaders(rateLimited, request);
    return rateLimited;
  }

  const response = NextResponse.next();
  setSecurityHeaders(response, request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml|map)$).*)",
  ],
};
