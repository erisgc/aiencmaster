import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateSiteSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(120)
  backgroundIntervalSeconds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  backgroundFadeSeconds?: number;

  @IsOptional()
  @IsBoolean()
  backgroundEnabled?: boolean;
}
