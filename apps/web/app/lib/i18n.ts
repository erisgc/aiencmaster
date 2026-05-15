/**
 * Helpers para mostrar valores del backend (roles, estados, códigos de
 * auditoría) en español al usuario final. Todos los administradores son
 * hispanohablantes — los identificadores quedan en el código (legibles
 * para el desarrollador) pero al usuario nunca le mostramos "ROOT",
 * "PENDING", "ADMIN_INVITATION_CREATED", etc.
 */

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'ROOT':
      return 'Administrador principal';
    case 'ADMIN':
      return 'Administrador';
    default:
      return role ?? '—';
  }
}

/** Versión corta para badges/chips donde no cabe el texto largo. */
export function roleShortLabel(role: string | null | undefined): string {
  switch (role) {
    case 'ROOT':
      return 'Principal';
    case 'ADMIN':
      return 'Admin';
    default:
      return role ?? '—';
  }
}

export function invitationStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'ACCEPTED':
      return 'Aceptada';
    case 'REVOKED':
      return 'Revocada';
    case 'EXPIRED':
      return 'Expirada';
    default:
      return status ?? '—';
  }
}

export function reportTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'OFFERINGS':
      return 'Ofrendas';
    case 'ATTENDANCE':
      return 'Asistencia';
    case 'EXPENSES':
      return 'Gasto / egreso';
    case 'EVENT':
      return 'Evento especial';
    case 'REQUEST':
      return 'Solicitud';
    case 'OTHER':
      return 'Otro';
    default:
      return type ?? '—';
  }
}

/**
 * Traduce los códigos de la tabla de auditoría (admin-audit.service.ts) a
 * frases legibles. Mantén sincronizada con la app Flutter
 * (apps/admin_app/lib/core/models/domain.dart).
 */
export function actionTypeLabel(code: string): string {
  switch (code) {
    case 'ADMIN_LOGIN_SUCCESS':
      return 'Inicio de sesión';
    case 'ADMIN_LOGIN_FAILED':
      return 'Intento de inicio de sesión fallido';
    case 'ADMIN_LOGOUT':
      return 'Cierre de sesión';
    case 'ADMIN_INVITATION_CREATED':
      return 'Invitación creada';
    case 'ADMIN_INVITATION_REVOKED':
      return 'Invitación revocada';
    case 'ADMIN_INVITATION_ACCEPTED':
      return 'Invitación aceptada';
    case 'ADMIN_ACCOUNT_CREATED':
      return 'Cuenta creada';
    case 'ADMIN_ACCOUNT_DEACTIVATED':
      return 'Cuenta desactivada';
    case 'ADMIN_ACCOUNT_REACTIVATED':
      return 'Cuenta reactivada';
    case 'ADMIN_PERMISSIONS_UPDATED':
      return 'Permisos actualizados';
    case 'ADMIN_CHURCH_ASSIGNED':
      return 'Iglesia asignada';
    case 'ADMIN_CHURCH_UNASSIGNED':
      return 'Iglesia removida';
    case 'REPORT_CREATED':
      return 'Informe creado';
    case 'REPORT_UPDATED':
      return 'Informe editado';
    case 'REPORT_DELETED':
      return 'Informe eliminado';
    case 'ANNOUNCEMENT_CREATED':
      return 'Anuncio creado';
    case 'ANNOUNCEMENT_UPDATED':
      return 'Anuncio editado';
    case 'ANNOUNCEMENT_DELETED':
      return 'Anuncio eliminado';
    case 'CHURCH_ANNOUNCEMENT_CREATED':
      return 'Anuncio de iglesia creado';
    case 'CHURCH_ANNOUNCEMENT_UPDATED':
      return 'Anuncio de iglesia editado';
    case 'CHURCH_ANNOUNCEMENT_DELETED':
      return 'Anuncio de iglesia eliminado';
    case 'CHURCH_CREATED':
      return 'Iglesia creada';
    case 'CHURCH_UPDATED':
      return 'Iglesia editada';
    case 'CHURCH_DEACTIVATED':
      return 'Iglesia desactivada';
    case 'CHURCH_REACTIVATED':
      return 'Iglesia reactivada';
    case 'DIRECTOR_CREATED':
      return 'Director añadido';
    case 'DIRECTOR_UPDATED':
      return 'Director editado';
    case 'DIRECTOR_DELETED':
      return 'Director eliminado';
    case 'ADMIN_ORIGIN_REJECTED':
      return 'Petición bloqueada (origen inválido)';
    default: {
      // Fallback: "SNAKE_CASE" → "Snake case"
      const cleaned = code.replace(/_/g, ' ').toLowerCase();
      if (cleaned.length === 0) return code;
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
}

export function targetTypeLabel(targetType: string | null | undefined): string {
  switch (targetType) {
    case 'REPORT':
      return 'Informe';
    case 'ANNOUNCEMENT':
      return 'Anuncio global';
    case 'CHURCH_ANNOUNCEMENT':
      return 'Anuncio de iglesia';
    case 'CHURCH':
      return 'Iglesia';
    case 'ADMIN_INVITATION':
      return 'Invitación';
    case 'ADMIN_ACCOUNT':
      return 'Cuenta de administrador';
    case 'DIRECTOR':
      return 'Director';
    case 'ADMIN_HTTP_REQUEST':
      return 'Petición HTTP';
    case null:
    case undefined:
    case '':
      return '—';
    default:
      return targetType;
  }
}
