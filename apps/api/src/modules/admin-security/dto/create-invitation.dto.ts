import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

import {
  ChurchPermission,
  GlobalPermission,
} from "../permissions/permission.enums";
import { AdminRole } from "../enums/admin-role.enum";

export class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: "username may only contain letters, numbers, '_', '.' and '-'",
  })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string;

  /**
   * Rol con el que se creará la cuenta al aceptar la invitación. Por
   * defecto ADMIN. Sólo otra cuenta ROOT puede pedir ROOT — el service
   * valida esa restricción explícitamente además de los guards.
   */
  @IsOptional()
  @IsEnum(AdminRole)
  targetRole?: AdminRole;

  /**
   * Iglesia asignada. Obligatoria para ADMIN; ignorada para ROOT.
   * `ValidateIf` permite omitirla cuando la invitación es para ROOT.
   */
  @ValidateIf((o: CreateInvitationDto) => o.targetRole !== AdminRole.ROOT)
  @IsUUID("4")
  assignedChurchId?: string;

  /**
   * Permisos pre-asignados sobre la iglesia (opcional). Si no se envía,
   * se aplican todos los permisos de iglesia por defecto. Ignorado para
   * invitaciones ROOT.
   */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ChurchPermission, { each: true })
  churchPermissions?: ChurchPermission[];

  /** Permisos globales pre-asignados (opcional). Ignorado para ROOT. */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(GlobalPermission, { each: true })
  globalPermissions?: GlobalPermission[];
}
