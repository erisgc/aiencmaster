import { BadRequestException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

type ClassConstructor<T extends object> = new (...args: any[]) => T;

export async function validateDto<T extends object>(
  cls: ClassConstructor<T>,
  payload: object,
): Promise<T> {
  const dto = plainToInstance(cls, payload as Record<string, unknown>);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new BadRequestException(errors);
  }

  return dto;
}
