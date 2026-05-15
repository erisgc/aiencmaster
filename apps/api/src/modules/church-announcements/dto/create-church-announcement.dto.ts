import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateChurchAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  author!: string;
}
