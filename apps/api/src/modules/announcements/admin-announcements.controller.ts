import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";

import { validateDto } from "../../common/validation/validate-dto";
import { validateUploadedFiles } from "../../common/validation/file-validation";
import { AdminAuditService } from "../admin-security/admin-audit.service";
import { AdminAuth } from "../admin-security/decorators/admin-auth.decorator";
import type {
  AuthenticatedAdminContext,
  AdminRequest,
} from "../admin-security/admin-security.types";
import { AdminAuthGuard } from "../admin-security/guards/admin-auth.guard";
import { AdminOriginGuard } from "../admin-security/guards/admin-origin.guard";
import { GlobalPermissionsGuard } from "../admin-security/permissions/global-permissions.guard";
import { RequireGlobalPermission } from "../admin-security/permissions/require-permission.decorator";
import { GlobalPermission } from "../admin-security/permissions/permission.enums";
import { AnnouncementsService } from "./announcements.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";

type IncomingFile = {
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

@Controller("admin/announcements")
@UseGuards(AdminOriginGuard, AdminAuthGuard, GlobalPermissionsGuard)
export class AdminAnnouncementsController {
  constructor(
    private readonly service: AnnouncementsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Post()
  @RequireGlobalPermission(GlobalPermission.MANAGE_GLOBAL_ANNOUNCEMENTS)
  async create(
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const dto: CreateAnnouncementDto = {
      title: "",
      description: "",
      author: "",
    };

    const files: IncomingFile[] = [];

    for await (const part of req.parts()) {
      if (part.type === "file") {
        files.push({
          filename: part.filename,
          mimetype: part.mimetype,
          buffer: await part.toBuffer(),
        });
      } else {
        dto[part.fieldname as keyof CreateAnnouncementDto] =
          part.value as string;
      }
    }

    const validatedDto = await validateDto(CreateAnnouncementDto, dto);
    validateUploadedFiles(files);
    const announcement = await this.service.createWithFiles(
      validatedDto,
      files,
    );

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "ANNOUNCEMENT_CREATED",
      targetType: "ANNOUNCEMENT",
      targetId: announcement.id,
      description: `Anuncio creado: ${announcement.title}`,
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
    });

    return announcement;
  }

  @Put(":id")
  @RequireGlobalPermission(GlobalPermission.MANAGE_GLOBAL_ANNOUNCEMENTS)
  async update(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const announcement = await this.service.update(id, dto);

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "ANNOUNCEMENT_UPDATED",
      targetType: "ANNOUNCEMENT",
      targetId: announcement.id,
      description: `Anuncio actualizado: ${announcement.title}`,
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
    });

    return announcement;
  }

  @Delete(":id")
  @RequireGlobalPermission(GlobalPermission.MANAGE_GLOBAL_ANNOUNCEMENTS)
  async remove(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const result = await this.service.remove(id);

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "ANNOUNCEMENT_DELETED",
      targetType: "ANNOUNCEMENT",
      targetId: id,
      description: "Anuncio eliminado",
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
    });

    return result;
  }
}
