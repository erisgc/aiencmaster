import { IsOptional, IsString } from "class-validator";

export class ResolveAccessRequestDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
