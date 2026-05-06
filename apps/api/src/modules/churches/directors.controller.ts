import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { validateDto } from "../../common/validation/validate-dto";
import type { ValidatableFile } from "../../common/validation/file-validation";
import { AdminAuditService } from "../admin-security/admin-audit.service";
import { AdminAuth } from "../admin-security/decorators/admin-auth.decorator";
import { AdminAuthGuard } from "../admin-security/guards/admin-auth.guard";
import { AdminOriginGuard } from "../admin-security/guards/admin-origin.guard";
import type {
  AdminRequest,
  AuthenticatedAdminContext,
} from "../admin-security/admin-security.types";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { UpdateDirectorDto } from "./dto/update-director.dto";
import { DirectorsService } from "./directors.service";

interface MultipartPart {
  type: "file" | "field";
  filename: string;
  mimetype: string;
  fieldname: string;
  value?: unknown;
  toBuffer(): Promise<Buffer>;
}

async function parseMultipart(req: AdminRequest) {
  const fields: Record<string, string> = {};
  let photo: ValidatableFile | null = null;
  for await (const part of req.parts() as AsyncIterable<MultipartPart>) {
    if (part.type === "file") {
      const file: ValidatableFile = {
        filename: part.filename,
        mimetype: part.mimetype,
        buffer: await part.toBuffer(),
      };
      if (part.fieldname === "photo") photo = file;
    } else if (typeof part.value === "string") {
      fields[part.fieldname] = part.value;
    }
  }
  return { fields, photo };
}

@Controller("admin/churches/:churchId/directors")
@UseGuards(AdminOriginGuard, AdminAuthGuard)
export class AdminDirectorsController {
  constructor(
    private readonly service: DirectorsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Get()
  list(
    @Param("churchId", new ParseUUIDPipe({ version: "4" })) churchId: string,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    return this.service.findAdminByChurch(churchId, actor.account);
  }

  @Post()
  async create(
    @Param("churchId", new ParseUUIDPipe({ version: "4" })) churchId: string,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const { fields, photo } = await parseMultipart(req);
    const dto = await validateDto(CreateDirectorDto, fields);
    const created = await this.service.create(
      churchId,
      dto,
      photo,
      actor.account,
    );

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "CHURCH_DIRECTOR_CREATED",
      targetType: "CHURCH_DIRECTOR",
      targetId: created.id,
      description: `Director añadido: ${created.displayName}`,
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
      metadata: { churchId },
    });

    return created;
  }
}

@Controller("admin/directors")
@UseGuards(AdminOriginGuard, AdminAuthGuard)
export class AdminDirectorByIdController {
  constructor(
    private readonly service: DirectorsService,
    private readonly auditService: AdminAuditService,
  ) {}

  @Patch(":id")
  async update(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const { fields, photo } = await parseMultipart(req);
    const dto = await validateDto(UpdateDirectorDto, fields);
    const updated = await this.service.update(id, dto, photo, actor.account);

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "CHURCH_DIRECTOR_UPDATED",
      targetType: "CHURCH_DIRECTOR",
      targetId: id,
      description: `Director actualizado: ${updated.displayName}`,
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
    });

    return updated;
  }

  @Delete(":id")
  async remove(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Req() req: AdminRequest,
    @AdminAuth() actor: AuthenticatedAdminContext,
  ) {
    const result = await this.service.remove(id, actor.account);

    await this.auditService.log({
      actorAdminAccountId: actor.account.id,
      actorDeviceId: actor.device.id,
      actionType: "CHURCH_DIRECTOR_DELETED",
      targetType: "CHURCH_DIRECTOR",
      targetId: id,
      description: "Director eliminado",
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers["user-agent"] === "string"
          ? req.headers["user-agent"]
          : "",
    });

    return result;
  }
}
