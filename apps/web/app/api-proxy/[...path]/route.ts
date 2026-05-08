import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy interno hacia el backend.
 *
 * Convierte cada Set-Cookie del backend en una cookie first-party del
 * dominio del frontend, usando la API de NextResponse.cookies para
 * garantizar que múltiples cookies se serialicen correctamente (cada
 * una en su propio header HTTP, sin concatenación con coma que rompe
 * el parser del browser cuando hay `Expires=...` con coma).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBackendUrl(): string {
  const url =
    process.env.API_INTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new Error(
      "API_INTERNAL_URL o NEXT_PUBLIC_API_URL deben estar configurados",
    );
  }
  return url.replace(/\/$/, "");
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
]);

interface ParsedCookie {
  name: string;
  value: string;
  options: {
    path?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
  };
}

/**
 * Parsea un único string Set-Cookie como el que devuelve `getSetCookie()`.
 * Ignora a propósito el atributo `Domain=` (queremos que la cookie se
 * asocie al dominio del frontend, no al del backend).
 */
function parseSetCookie(raw: string): ParsedCookie | null {
  const parts = raw.split(";").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const head = parts[0];
  const eq = head.indexOf("=");
  if (eq <= 0) return null;
  const name = head.slice(0, eq).trim();
  const value = head.slice(eq + 1).trim();

  const options: ParsedCookie["options"] = {};

  for (let i = 1; i < parts.length; i++) {
    const attr = parts[i];
    const lower = attr.toLowerCase();
    if (lower === "httponly") {
      options.httpOnly = true;
    } else if (lower === "secure") {
      options.secure = true;
    } else if (lower.startsWith("samesite=")) {
      const v = attr.slice("samesite=".length).toLowerCase();
      if (v === "lax" || v === "strict" || v === "none") options.sameSite = v;
    } else if (lower.startsWith("max-age=")) {
      const n = Number(attr.slice("max-age=".length));
      if (Number.isFinite(n)) options.maxAge = n;
    } else if (lower.startsWith("expires=")) {
      const d = new Date(attr.slice("expires=".length));
      if (!Number.isNaN(d.getTime())) options.expires = d;
    } else if (lower.startsWith("path=")) {
      options.path = attr.slice("path=".length);
    }
    // Domain= se ignora intencionalmente.
  }

  return { name, value, options };
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const incomingUrl = new URL(req.url);
  const target = `${getBackendUrl()}/${path.join("/")}${incomingUrl.search}`;

  const outgoingHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    outgoingHeaders.set(key, value);
  });

  // Forzar Origin/Referer al WEB_ORIGIN para que el AdminOriginGuard
  // del backend acepte la petición.
  const webOrigin =
    process.env.WEB_ORIGIN?.trim() ||
    `${incomingUrl.protocol}//${incomingUrl.host}`;
  outgoingHeaders.set("origin", webOrigin);
  outgoingHeaders.set("referer", webOrigin);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  let bodyBuffer: ArrayBuffer | null = null;
  if (hasBody) {
    bodyBuffer = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: outgoingHeaders,
      body: bodyBuffer,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (err) {
    return NextResponse.json(
      {
        message: "Upstream unreachable",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  const responseBuffer = await upstream.arrayBuffer();

  const response = new NextResponse(responseBuffer, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Copiar headers normales (sin set-cookie ni encoding ni length).
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie") return;
    if (k === "transfer-encoding" || k === "content-encoding") return;
    if (k === "content-length") return;
    response.headers.set(key, value);
  });

  // Reescribir cada Set-Cookie como una cookie first-party.
  const upstreamHeaders = upstream.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const rawSetCookies =
    typeof upstreamHeaders.getSetCookie === "function"
      ? upstreamHeaders.getSetCookie()
      : [];

  for (const raw of rawSetCookies) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;
    response.cookies.set({
      name: parsed.name,
      value: parsed.value,
      ...parsed.options,
    });
  }

  return response;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
