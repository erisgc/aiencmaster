import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AdminAuditService } from "./admin-audit.service";
import { AdminAuth } from "./decorators/admin-auth.decorator";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { AdminOriginGuard } from "./guards/admin-origin.guard";
import { RootDeviceGuard } from "./guards/root-device.guard";
import { RootRoleGuard } from "./guards/root-role.guard";
import type {
  AdminRequest,
  AuthenticatedAdminContext,
} from "./admin-security.types";
import { AdminInvitationsService } from "./admin-invitations.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CreateInvitationDto } from "./dto/create-invitation.dto";

/**
 * Endpoints administrativos (ROOT) — gestión de invitaciones.
 */
@Controller("admin/security/invitations")
@UseGuards(AdminOriginGuard, AdminAuthGuard, RootRoleGuard, RootDeviceGuard)
export class AdminInvitationsController {
  constructor(
    private readonly service: AdminInvitationsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  async create(
    @Body() dto: CreateInvitationDto,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const invitation = await this.service.create({
      username: dto.username,
      displayName: dto.displayName,
      assignedChurchId: dto.assignedChurchId,
      createdByAdminAccountId: actor.account.id,
      churchPermissions: dto.churchPermissions,
      globalPermissions: dto.globalPermissions,
    });

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "ADMIN_INVITATION_CREATED",
      targetType: "ADMIN_INVITATION",
      targetId: invitation.id,
      description: `Invitación creada para @${invitation.username} (iglesia ${invitation.assignedChurchId})`,
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
      metadata: {
        username: invitation.username,
        churchId: invitation.assignedChurchId,
      },
    });

    return invitation;
  }

  @Delete(":id")
  async revoke(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const result = await this.service.revoke(id);

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "ADMIN_INVITATION_REVOKED",
      targetType: "ADMIN_INVITATION",
      targetId: id,
      description: "Invitación revocada",
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
    });

    return result;
  }
}

/**
 * Endpoints públicos para que el invitado consulte y acepte.
 * Sólo requieren validación de origen (CSRF), no autenticación.
 */
@Controller("admin/auth/invitations")
@UseGuards(AdminOriginGuard)
export class PublicInvitationsController {
  constructor(private readonly service: AdminInvitationsService) {}

  /**
   * Vista previa del estado de un token sin aceptarlo.
   * Recibe el token vía query string para que el frontend pueda
   * renderizar la información antes de pedir contraseña.
   */
  @Get("preview")
  preview(@Query("token") token: string) {
    return this.service.preview(token ?? "");
  }

  @Post("accept")
  accept(@Body() dto: AcceptInvitationDto) {
    return this.service.accept(dto.token, dto.password);
  }
}
