import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AdminRequest } from "../admin-security.types";
import { GlobalPermission } from "./permission.enums";
import { PermissionsService } from "./permissions.service";
import { REQUIRED_GLOBAL_PERMISSIONS_KEY } from "./require-permission.decorator";

/**
 * Guard que aplica los permisos globales declarados con
 * `@RequireGlobalPermission(...)`. Debe combinarse con
 * `AdminAuthGuard` antes (que populariza `req.adminAuth`).
 */
@Injectable()
export class GlobalPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<GlobalPermission[]>(
        REQUIRED_GLOBAL_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AdminRequest>();
    const account = req.adminAuth?.account;
    if (!account) {
      throw new UnauthorizedException("Admin session required");
    }

    for (const permission of required) {
      if (!this.permissions.hasGlobalPermission(account, permission)) {
        throw new ForbiddenException(`Falta permiso global: ${permission}`);
      }
    }

    return true;
  }
}
