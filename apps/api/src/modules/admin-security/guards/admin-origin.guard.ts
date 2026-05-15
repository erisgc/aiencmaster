import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { AdminAuditService } from "../admin-audit.service";
import type { AdminRequest } from "../admin-security.types";

@Injectable()
export class AdminOriginGuard implements CanActivate {
  private readonly safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

  constructor(private readonly auditService: AdminAuditService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    if (this.safeMethods.has(request.method.toUpperCase())) {
      return true;
    }

    const allowedOrigins = this.getAllowedOrigins();
    const origin = this.extractOriginHeader(request.headers.origin);
    const referer = this.extractHeader(request.headers.referer);

    // Para requests que modifican estado (POST/PUT/PATCH/DELETE)
    // requerimos presencia explícita de Origin o Referer válido.
    // Aceptamos:
    //   - WEB_ORIGIN (la web Next.js en producción/local)
    //   - MOBILE_APP_ORIGIN (la app Flutter, ej. "aiencadmin://app")
    // Si tanto Origin como Referer son inválidos, rechazamos.
    const originAllowed = origin !== null && allowedOrigins.includes(origin);
    const refererAllowed =
      referer !== null &&
      allowedOrigins.some((o) => this.matchesAllowedOrigin(referer, o));

    if (originAllowed || refererAllowed) {
      return true;
    }

    await this.auditService.log({
      actorAdminAccountId: request.adminAuth?.account.id ?? null,
      actorDeviceId: request.adminAuth?.device.id ?? null,
      actionType: "ADMIN_ORIGIN_REJECTED",
      targetType: "ADMIN_HTTP_REQUEST",
      description: `Request bloqueada por validación de Origin/Referer: ${request.method} ${request.url}`,
      ip: request.ip ?? null,
      userAgent:
        typeof request.headers["user-agent"] === "string"
          ? request.headers["user-agent"]
          : "",
      metadata: {
        origin,
        referer,
        allowedOrigins,
      },
    });

    throw new ForbiddenException("Invalid request origin");
  }

  /**
   * Lista de orígenes válidos. Por defecto sólo el `WEB_ORIGIN` (la web
   * Next.js), pero si `MOBILE_APP_ORIGIN` está configurado se acepta también.
   * El valor típico para la app Flutter es `aiencadmin://app`, que coincide
   * con el esquema custom registrado en AndroidManifest.xml.
   */
  private getAllowedOrigins(): string[] {
    const web =
      process.env.WEB_ORIGIN?.trim() || "http://localhost:3000";
    const origins: string[] = [];
    try {
      origins.push(new URL(web).origin);
    } catch {
      // configuración inválida — fallback al default
      origins.push("http://localhost:3000");
    }
    const mobile = process.env.MOBILE_APP_ORIGIN?.trim();
    if (mobile && mobile.length > 0) {
      try {
        // URL("aiencadmin://app").origin → "aiencadmin://app"
        origins.push(new URL(mobile).origin);
      } catch {
        // ignorar valor mal formado
      }
    }
    return origins;
  }

  private extractOriginHeader(value: unknown) {
    const header = this.extractHeader(value);
    if (!header) return null;

    try {
      return new URL(header).origin;
    } catch {
      return null;
    }
  }

  private extractHeader(value: unknown) {
    return typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private matchesAllowedOrigin(value: string, allowedOrigin: string) {
    try {
      return new URL(value).origin === allowedOrigin;
    } catch {
      return false;
    }
  }
}
