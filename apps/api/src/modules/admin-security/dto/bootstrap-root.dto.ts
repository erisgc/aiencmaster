import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class BootstrapRootDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  secret!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceName!: string;

  @IsString()
  @MaxLength(50)
  platform!: string;

  @IsString()
  @MaxLength(100)
  browser!: string;
}
