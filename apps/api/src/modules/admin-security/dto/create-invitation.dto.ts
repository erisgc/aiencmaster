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
} from "class-validator";

import {
  ChurchPermission,
  GlobalPermission,
} from "../permissions/permission.enums";

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

  @IsUUID("4")
  assignedChurchId!: string;

  /**
   * Permisos pre-asignados sobre la iglesia (opcional). Si no se envía,
   * se aplican todos los permisos de iglesia por defecto.
   */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ChurchPermission, { each: true })
  churchPermissions?: ChurchPermission[];

  /** Permisos globales pre-asignados (opcional, raramente usados). */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(GlobalPermission, { each: true })
  globalPermissions?: GlobalPermission[];
}
