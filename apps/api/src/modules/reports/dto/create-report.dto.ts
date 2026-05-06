import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

import { ReportType } from "../enums/report-type.enum";

export class CreateReportDto {
  @IsUUID("4")
  churchId!: string;

  @IsEnum(ReportType)
  reportType!: ReportType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  /**
   * Payload específico del tipo de informe.
   * La validación de forma se hace en el service según `reportType`.
   */
  @IsObject()
  @Type(() => Object)
  data!: Record<string, unknown>;
}
