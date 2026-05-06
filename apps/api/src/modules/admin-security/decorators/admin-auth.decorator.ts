import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { AdminRequest } from "../admin-security.types";

export const AdminAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AdminRequest>();
    return request.adminAuth;
  },
);
