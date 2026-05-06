import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { AdminSessionService } from "../admin-session.service";
import type { AdminRequest } from "../admin-security.types";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly sessionService: AdminSessionService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    request.adminAuth =
      await this.sessionService.validateActiveAdminRequest(request);
    return true;
  }
}
