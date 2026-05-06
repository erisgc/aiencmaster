import { IsOptional, IsString } from "class-validator";

export class QueryAuditLogDto {
  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  actorAdminAccountId?: string;
}
