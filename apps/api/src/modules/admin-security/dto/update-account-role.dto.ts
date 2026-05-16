import { IsEnum } from "class-validator";

import { AdminRole } from "../enums/admin-role.enum";

/**
 * DTO para cambiar el rol de una cuenta existente. Sólo ROOT puede invocarlo
 * (los guards del controller lo enforcearan), y el service además valida:
 *   - el actor no es la propia cuenta target
 *   - si se degrada un ROOT, queda al menos otra cuenta ROOT activa
 */
export class UpdateAccountRoleDto {
  @IsEnum(AdminRole)
  role!: AdminRole;
}
