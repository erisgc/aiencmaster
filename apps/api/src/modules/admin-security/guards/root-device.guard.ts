import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { AdminAuditService } from "../admin-audit.service";
import { AdminDeviceScope } from "../enums/admin-device-scope.enum";
import type { AdminRequest } from "../admin-security.types";

@Injectable()
export class RootDeviceGuard implements CanActivate {
  constructor(private readonly auditService: AdminAuditService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (request.adminAuth?.device.roleScope !== AdminDeviceScope.ROOT_DEVICE) {
      await this.auditService.log({
        actorAdminAccountId: request.adminAuth?.account.id ?? null,
        actorDeviceId: request.adminAuth?.device.id ?? null,
        actionType: "ROOT_ACCESS_DENIED_DEVICE",
        targetType: "ADMIN_SECURITY",
        description:
          "Acceso denegado al módulo root: el dispositivo no es ROOT_DEVICE.",
        ip: request.ip ?? null,
        userAgent:
          typeof request.headers["user-agent"] === "string"
            ? request.headers["user-agent"]
            : "",
      });
      throw new ForbiddenException("Root device required");
    }

    return true;
  }
}
