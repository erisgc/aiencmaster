import { ArrayUnique, IsArray, IsEnum } from "class-validator";

import { GlobalPermission } from "../permissions/permission.enums";

export class UpdateGlobalPermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsEnum(GlobalPermission, { each: true })
  permissions!: GlobalPermission[];
}
