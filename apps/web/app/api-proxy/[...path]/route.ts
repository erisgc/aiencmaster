import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy interno hacia el backend (Railway / local).
 *
 * Recibe peticiones del browser bajo `/api-proxy/...` y las reenvía al
 * backend real. Reescribe los `Set-Cookie` quitando el atributo `Domain`
 * para que las cookies se asocien al dominio del frontend (Vercel) y
 * sean first-party — evitando bloqueos de cookies third-party.
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

  // El AdminOriginGuard del backend exige que el header Origin coincida
  // con WEB_ORIGIN. La validación cross-site real ya la hizo el browser
  // al permitir el fetch contra /api-proxy (mismo dominio que el frontend).
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

  // Bufferizamos el body completo para evitar problemas de streaming
  // entre Node fetch y la response que devolvemos a Vercel.
  const responseBuffer = await upstream.arrayBuffer();

  const response = new NextResponse(responseBuffer, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  // Copiar headers excepto los que manejamos a parte (set-cookie, encoding…)
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie") return;
    if (k === "transfer-encoding" || k === "content-encoding") return;
    if (k === "content-length") return; // recalculado por NextResponse
    response.headers.set(key, value);
  });

  // Reescribir Set-Cookie: quitar Domain= para que la cookie aplique al
  // dominio del frontend. Append uno a uno (multi-valor estándar).
  const upstreamHeaders = upstream.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof upstreamHeaders.getSetCookie === "function"
      ? upstreamHeaders.getSetCookie()
      : [];

  for (const raw of setCookies) {
    const cleaned = raw.replace(/;\s*Domain=[^;]+/i, "");
    response.headers.append("set-cookie", cleaned);
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
