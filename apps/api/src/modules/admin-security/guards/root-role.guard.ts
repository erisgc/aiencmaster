import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { AdminAuditService } from "../admin-audit.service";
import { AdminRole } from "../enums/admin-role.enum";
import type { AdminRequest } from "../admin-security.types";

@Injectable()
export class RootRoleGuard implements CanActivate {
  constructor(private readonly auditService: AdminAuditService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (request.adminAuth?.account.role !== AdminRole.ROOT) {
      await this.auditService.log({
        actorAdminAccountId: request.adminAuth?.account.id ?? null,
        actorDeviceId: request.adminAuth?.device.id ?? null,
        actionType: "ROOT_ACCESS_DENIED_ROLE",
        targetType: "ADMIN_SECURITY",
        description:
          "Acceso denegado al módulo root: la cuenta no tiene rol ROOT.",
        ip: request.ip ?? null,
        userAgent:
          typeof request.headers["user-agent"] === "string"
            ? request.headers["user-agent"]
            : "",
      });
      throw new ForbiddenException("Root role required");
    }

    return true;
  }
}
