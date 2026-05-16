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
import {
  AssignChurchDto,
  UpdateChurchPermissionsDto,
} from "./dto/assign-church.dto";
import { CreateAdminAccountDto } from "./dto/create-admin-account.dto";
import { QueryAuditLogDto } from "./dto/query-audit-log.dto";
import { ResetAdminPasswordDto } from "./dto/reset-admin-password.dto";
import { ResolveAccessRequestDto } from "./dto/resolve-access-request.dto";
import { UpdateAccountRoleDto } from "./dto/update-account-role.dto";
import { UpdateAdminAccountDto } from "./dto/update-admin-account.dto";
import { UpdateGlobalPermissionsDto } from "./dto/update-global-permissions.dto";
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

  /* ────────── Permisos ────────── */

  @Get("permissions/catalog")
  permissionsCatalog() {
    return this.securityService.getPermissionsCatalog();
  }

  @Patch("accounts/:id/permissions")
  updateGlobalPermissions(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateGlobalPermissionsDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.updateGlobalPermissions(
      id,
      dto.permissions,
      actor,
    );
  }

  @Post("accounts/:id/churches")
  assignChurch(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: AssignChurchDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.assignChurch(
      id,
      dto.churchId,
      dto.permissions ?? [],
      actor,
    );
  }

  @Patch("accounts/:id/churches/:churchId/permissions")
  updateChurchPermissions(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Param("churchId", new ParseUUIDPipe({ version: "4" })) churchId: string,
    @Body() dto: UpdateChurchPermissionsDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.assignChurch(
      id,
      churchId,
      dto.permissions,
      actor,
    );
  }

  @Post("accounts/:id/churches/:churchId/remove")
  removeChurchAssignment(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Param("churchId", new ParseUUIDPipe({ version: "4" })) churchId: string,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.removeChurchAssignment(id, churchId, actor);
  }

  /**
   * Cambia el rol de una cuenta existente (ADMIN ↔ ROOT). Requiere que el
   * actor sea ROOT (los guards lo aseguran) y que la cuenta target NO sea
   * la propia (el service lo valida). Al degradar un ROOT se exige que
   * quede al menos otro ROOT activo.
   */
  @Patch("accounts/:id/role")
  updateAccountRole(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateAccountRoleDto,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.securityService.updateAccountRole(id, dto.role, actor);
  }
}
