import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";

import { AdminAccount } from "./admin-account.entity";
import { AdminChurchAssignment } from "./admin-church-assignment.entity";
import { AdminRole } from "./enums/admin-role.enum";
import { ALL_CHURCH_PERMISSIONS } from "./permissions/permission.enums";

/**
 * Migra el modelo viejo (un admin → una iglesia) al nuevo
 * (many-to-many con permisos por iglesia).
 *
 * Para cada admin no-ROOT que tenga `assignedChurchId`:
 *  - Si NO hay una asignación previa en `admin_church_assignments`,
 *    crea una con TODOS los permisos de iglesia (equivalente al
 *    comportamiento previo: tenía acceso completo a su iglesia).
 *
 * Idempotente: si la asignación ya existe, no se duplica ni se pisa.
 */
@Injectable()
export class AdminAssignmentsMigratorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminAssignmentsMigratorService.name);

  constructor(
    @InjectRepository(AdminAccount)
    private readonly accountRepo: Repository<AdminAccount>,
    @InjectRepository(AdminChurchAssignment)
    private readonly assignmentRepo: Repository<AdminChurchAssignment>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const accounts = await this.accountRepo.find({
        where: { assignedChurchId: Not(IsNull()) },
      });

      if (accounts.length === 0) return;

      let migrated = 0;
      for (const account of accounts) {
        if (account.role === AdminRole.ROOT) continue;
        if (!account.assignedChurchId) continue;

        const existing = await this.assignmentRepo.findOne({
          where: {
            adminAccountId: account.id,
            churchId: account.assignedChurchId,
          },
        });
        if (existing) continue;

        await this.assignmentRepo.save(
          this.assignmentRepo.create({
            adminAccountId: account.id,
            churchId: account.assignedChurchId,
            permissions: [...ALL_CHURCH_PERMISSIONS],
          }),
        );
        migrated++;
      }

      if (migrated > 0) {
        this.logger.log(
          `Migración legacy completada: ${migrated} asignaciones admin↔iglesia creadas desde assignedChurchId.`,
        );
      }
    } catch (err) {
      // No bloqueamos el arranque por una migración fallida; sólo logueamos.
      this.logger.warn(
        `Migración legacy falló (continuando): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
