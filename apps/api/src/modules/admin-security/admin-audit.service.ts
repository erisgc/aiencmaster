import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AdminActionLog } from "./admin-action-log.entity";

type AuditLogInput = {
  actorAdminAccountId?: string | null;
  actorDeviceId?: string | null;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  description: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(
    @InjectRepository(AdminActionLog)
    private readonly auditRepo: Repository<AdminActionLog>,
  ) {}

  async log(
    input: AuditLogInput,
    repository: Repository<AdminActionLog> = this.auditRepo,
  ) {
    try {
      const entry = repository.create({
        actorAdminAccountId: input.actorAdminAccountId ?? null,
        actorDeviceId: input.actorDeviceId ?? null,
        actionType: input.actionType,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        description: input.description,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? "",
        metadata: input.metadata ?? null,
      });

      return await repository.save(entry);
    } catch (error) {
      this.logger.error(
        `Audit log write failed for ${input.actionType}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }
}
