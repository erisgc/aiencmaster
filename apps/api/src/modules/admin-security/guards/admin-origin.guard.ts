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

    const allowedOrigin = this.getAllowedOrigin();
    const origin = this.extractOriginHeader(request.headers.origin);
    const referer = this.extractHeader(request.headers.referer);

    // Para requests que modifican estado (POST/PUT/PATCH/DELETE)
    // requerimos presencia explícita de Origin o Referer válido.
    // Si ambos están ausentes o ambos son inválidos, rechazamos.
    const originAllowed = origin !== null && origin === allowedOrigin;
    const refererAllowed =
      referer !== null && this.matchesAllowedOrigin(referer, allowedOrigin);

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
        allowedOrigin,
      },
    });

    throw new ForbiddenException("Invalid request origin");
  }

  private getAllowedOrigin() {
    const configured =
      process.env.WEB_ORIGIN?.trim() || "http://localhost:3000";
    return new URL(configured).origin;
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
