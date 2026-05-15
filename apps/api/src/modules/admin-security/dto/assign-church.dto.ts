import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";

import { ChurchPermission } from "../permissions/permission.enums";

export class AssignChurchDto {
  @IsUUID("4")
  churchId!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ChurchPermission, { each: true })
  permissions?: ChurchPermission[];
}

export class UpdateChurchPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(ChurchPermission, { each: true })
  permissions!: ChurchPermission[];
}
