import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class AcceptInvitationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(200)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
