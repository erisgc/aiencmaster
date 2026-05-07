import { NextRequest } from "next/server";

/**
 * Proxy interno hacia el backend (Railway / local).
 *
 * Recibe peticiones del browser bajo `/api-proxy/...` y las reenvía al
 * backend real. Reescribe los `Set-Cookie` quitando el atributo `Domain`
 * para que las cookies se asocien al dominio del frontend (Vercel) y
 * sean first-party — evitando bloqueos de cookies third-party.
 *
 * Variables de entorno:
 *   - API_INTERNAL_URL    URL privada al backend (preferida).
 *   - NEXT_PUBLIC_API_URL Fallback público (si la primera no existe).
 *   - WEB_ORIGIN          Origen permitido (se reenvía al backend
 *                         para que el AdminOriginGuard acepte la
 *                         request).
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

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const incomingUrl = new URL(req.url);
  const target = `${getBackendUrl()}/${path.join("/")}${incomingUrl.search}`;

  const outgoingHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    // Headers que NO debemos reenviar tal cual
    if (
      k === "host" ||
      k === "connection" ||
      k === "content-length" ||
      k === "accept-encoding" ||
      k === "transfer-encoding"
    ) {
      return;
    }
    outgoingHeaders.set(key, value);
  });

  // Forzamos el Origin al WEB_ORIGIN para que el AdminOriginGuard del
  // backend acepte la petición. La validación cross-site real ya la
  // hizo el browser al permitir el fetch a /api-proxy (mismo dominio).
  const webOrigin =
    process.env.WEB_ORIGIN?.trim() ||
    `${incomingUrl.protocol}//${incomingUrl.host}`;
  outgoingHeaders.set("origin", webOrigin);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: outgoingHeaders,
    redirect: "manual",
    cache: "no-store",
  };
  if (hasBody) {
    // Streaming del body. `duplex: 'half'` es requerido por undici cuando
    // el body es un ReadableStream.
    init.body = req.body;
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    return new Response(
      JSON.stringify({
        message: "Upstream unreachable",
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      },
    );
  }

  // Reescribir Set-Cookie: quitar Domain= y Path= que apunten al
  // backend, para que las cookies queden bajo el dominio del frontend.
  const setCookies =
    typeof (upstream.headers as Headers & { getSetCookie?: () => string[] })
      .getSetCookie === "function"
      ? (
          upstream.headers as Headers & { getSetCookie: () => string[] }
        ).getSetCookie()
      : [];

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "set-cookie") return; // Las manejamos abajo
    if (k === "transfer-encoding" || k === "content-encoding") return;
    responseHeaders.set(key, value);
  });

  for (const raw of setCookies) {
    const cleaned = raw.replace(/;\s*Domain=[^;]+/i, "");
    responseHeaders.append("set-cookie", cleaned);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
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
