import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AdminAuth } from "./decorators/admin-auth.decorator";
import { AdminSecurityService } from "./admin-security.service";
import { CreateAdminAccountDto } from "./dto/create-admin-account.dto";
import { QueryAuditLogDto } from "./dto/query-audit-log.dto";
import { ResetAdminPasswordDto } from "./dto/reset-admin-password.dto";
import { ResolveAccessRequestDto } from "./dto/resolve-access-request.dto";
import { UpdateAdminAccountDto } from "./dto/update-admin-account.dto";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { AdminOriginGuard } from "./guards/admin-origin.guard";
import { RootDeviceGuard } from "./guards/root-device.guard";
import { RootRoleGuard } from "./guards/root-role.guard";
import type { AuthenticatedAdminContext } from "./admin-security.types";

@Controller("admin/security")
@UseGuards(AdminOriginGuard, AdminAuthGuard, RootRoleGuard, RootDeviceGuard)
export class AdminSecurityController {
  constructor(private readonly securityService: AdminSecurityService) {}

  @Get("summary")
  summary() {
    return this.securityService.getSummary();
  }

  @Get("access-requests")
  accessRequests() {
    return this.securityService.getPendingAccessRequests();
  }

  @Post("access-requests/:id/approve")
  approveAccessRequest(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ResolveAccessRequestDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.approveAccessRequest(id, dto, actor);
  }

  @Post("access-requests/:id/reject")
  rejectAccessRequest(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ResolveAccessRequestDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.rejectAccessRequest(id, dto, actor);
  }

  @Get("devices")
  devices() {
    return this.securityService.getDevices();
  }

  @Post("devices/:id/revoke")
  revokeDevice(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.revokeDevice(id, actor);
  }

  @Get("accounts")
  accounts() {
    return this.securityService.getAccounts();
  }

  @Post("accounts")
  createAccount(
    @Body() dto: CreateAdminAccountDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.createAdminAccount(dto, actor);
  }

  @Patch("accounts/:id")
  updateAccount(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateAdminAccountDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.updateAdminAccount(id, dto, actor);
  }

  @Post("accounts/:id/reset-password")
  resetPassword(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ResetAdminPasswordDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.resetAdminPassword(id, dto, actor);
  }

  @Get("audit-logs")
  auditLogs(@Query() query: QueryAuditLogDto) {
    return this.securityService.getAuditLogs(query);
  }

  @Get("accounts/:id/history")
  accountHistory(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    return this.securityService.getAccountHistory(id);
  }
}
