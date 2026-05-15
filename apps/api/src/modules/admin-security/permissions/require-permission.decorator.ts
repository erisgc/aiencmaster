import { SetMetadata } from "@nestjs/common";

import { GlobalPermission } from "./permission.enums";

export const REQUIRED_GLOBAL_PERMISSIONS_KEY = "required_global_permissions";

/**
 * Marca un endpoint para exigir uno o varios permisos globales.
 * Si se pasan varios, deben cumplirse TODOS (AND).
 *
 * Usar junto con `GlobalPermissionsGuard`.
 */
export const RequireGlobalPermission = (...permissions: GlobalPermission[]) =>
  SetMetadata(REQUIRED_GLOBAL_PERMISSIONS_KEY, permissions);
