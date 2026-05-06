import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  MinLength,
} from "class-validator";

import { AdminRole } from "../enums/admin-role.enum";

export class CreateAdminAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: "username may only contain letters, numbers, '_', '.' and '-'",
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;

  /**
   * Iglesia asignada al admin. Obligatoria salvo para ROOT.
   * Define el "dominio" sobre el cual el admin podrá generar informes.
   */
  @IsOptional()
  @IsUUID("4")
  assignedChurchId?: string;
}
