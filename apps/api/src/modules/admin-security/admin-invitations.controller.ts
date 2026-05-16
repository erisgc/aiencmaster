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
import { AdminRole } from "./enums/admin-role.enum";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { CreateInvitationDto } from "./dto/create-invitation.dto";

function userAgentOf(req: AdminRequest): string {
  return typeof req.headers["user-agent"] === "string"
    ? (req.headers["user-agent"] as string)
    : "";
}

/**
 * Endpoints administrativos (ROOT) — gestión de invitaciones.
 *
 * La cadena de confianza es estrictamente ROOT→ROOT: sólo una cuenta ROOT
 * autenticada y desde un dispositivo ROOT puede generar una invitación.
 * Si la invitación pide `targetRole = ROOT`, el servicio re-verifica el
 * rol del actor (defensa en profundidad — los guards ya lo restringen al
 * endpoint, pero la regla también vive en la capa de servicio).
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
      createdByAdminAccountRole: actor.account.role,
      targetRole: dto.targetRole,
      churchPermissions: dto.churchPermissions,
      globalPermissions: dto.globalPermissions,
    });

    // Auditoría enriquecida. Una invitación ROOT es un evento crítico
    // y debe quedar registrado con su propio actionType para que cualquier
    // alerta de seguridad lo detecte sin tener que parsear metadata.
    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType:
        invitation.targetRole === AdminRole.ROOT
          ? "ROOT_INVITATION_CREATED"
          : "ADMIN_INVITATION_CREATED",
      targetType: "ADMIN_INVITATION",
      targetId: invitation.id,
      description:
        invitation.targetRole === AdminRole.ROOT
          ? `Invitación ROOT creada para @${invitation.username}`
          : `Invitación creada para @${invitation.username} (iglesia ${invitation.assignedChurchId})`,
      ip: req.ip ?? null,
      userAgent: userAgentOf(req),
      metadata: {
        username: invitation.username,
        targetRole: invitation.targetRole,
        churchId: invitation.assignedChurchId,
        churchPermissions: dto.churchPermissions ?? [],
        globalPermissions: dto.globalPermissions ?? [],
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
      userAgent: userAgentOf(req),
    });

    return result;
  }
}

/**
 * Endpoints públicos para que el invitado consulte y acepte.
 * Sólo requieren validación de origen (CSRF), no autenticación.
 *
 * Aunque son públicos, la aceptación produce auditoría completa: una
 * `ADMIN_INVITATION_ACCEPTED` (referenciando la invitación), un
 * `ADMIN_ACCOUNT_CREATED` (referenciando la cuenta) y, si fue una
 * invitación ROOT, un `ROOT_ACCOUNT_CREATED` adicional para alertas.
 */
@Controller("admin/auth/invitations")
@UseGuards(AdminOriginGuard)
export class PublicInvitationsController {
  constructor(
    private readonly service: AdminInvitationsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get("preview")
  preview(@Query("token") token: string) {
    return this.service.preview(token ?? "");
  }

  @Post("accept")
  async accept(@Body() dto: AcceptInvitationDto, @Req() req: AdminRequest) {
    const account = await this.service.accept(dto.token, dto.password);

    // Audit a partir del registro recién creado. El actor es la propia
    // cuenta — quedamos con trazabilidad: "esta cuenta nació con esta
    // invitación, desde esta IP, este user-agent". No tenemos device-id
    // porque aún no hay sesión.
    const baseAudit = {
      actorAdminAccountId: account.id,
      actorDeviceId: null,
      ip: req.ip ?? null,
      userAgent: userAgentOf(req),
    };

    await this.auditService.log({
      ...baseAudit,
      actionType: "ADMIN_INVITATION_ACCEPTED",
      targetType: "ADMIN_INVITATION",
      targetId: account.id, // no tenemos el id de invitación aquí; lo replicamos en metadata
      description: `Invitación aceptada por @${account.username}`,
      metadata: {
        username: account.username,
        role: account.role,
      },
    });

    await this.auditService.log({
      ...baseAudit,
      actionType:
        account.role === AdminRole.ROOT
          ? "ROOT_ACCOUNT_CREATED"
          : "ADMIN_ACCOUNT_CREATED",
      targetType: "ADMIN_ACCOUNT",
      targetId: account.id,
      description:
        account.role === AdminRole.ROOT
          ? `Nueva cuenta ROOT activada: @${account.username}`
          : `Nueva cuenta de administrador activada: @${account.username}`,
      metadata: {
        username: account.username,
        role: account.role,
        assignedChurchId: account.assignedChurchId,
      },
    });

    return {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
    };
  }
}
