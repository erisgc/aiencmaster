/**
 * Tipos de informe que la administración de cada iglesia puede generar.
 * Extender aquí permite agregar nuevos tipos sin migraciones de tablas
 * (los datos específicos viven en `data` jsonb del registro Report).
 */
export enum ReportType {
  /** Ofrendas (ingresos del culto/mes). */
  OFFERINGS = "OFFERINGS",

  /**
   * Asistencia. Puede ser por culto (con fecha exacta) o consolidado
   * mensual. El campo data.scope discrimina:
   *   - 'session' → un culto puntual (data.sessionDate, data.count)
   *   - 'month'   → consolidado mensual (data.count, data.weeklyBreakdown[])
   */
  ATTENDANCE = "ATTENDANCE",

  /**
   * Gasto / egreso de presupuesto. Cubre todo lo que implique salida
   * de dinero o pérdida patrimonial:
   *   - Compras (sillas, abanicos, materiales)
   *   - Reparaciones / pintadas
   *   - Reportes de daños sin reparar todavía
   *   - Robos o pérdidas
   *   - Servicios públicos
   * El campo data.category lo distingue (ver ExpenseCategory).
   */
  EXPENSES = "EXPENSES",

  /** Evento especial (campañas, retiros, conferencias). */
  EVENT = "EVENT",

  /**
   * Solicitud formal de la iglesia hacia la administración central
   * (apoyo económico, materiales, gestión, autorización para algo).
   * El ROOT recibe estas solicitudes en un apartado propio y puede
   * marcarlas como atendidas. data.status lleva el estado.
   */
  REQUEST = "REQUEST",

  /** Otro tipo libre (texto). */
  OTHER = "OTHER",
}

/**
 * Subcategorías para EXPENSES.
 * No es un enum de DB — vive en data.category dentro del jsonb.
 */
export enum ExpenseCategory {
  PURCHASE = "PURCHASE",
  REPAIR = "REPAIR",
  DAMAGE = "DAMAGE",
  THEFT = "THEFT",
  UTILITIES = "UTILITIES",
  OTHER = "OTHER",
}

/** Estados para REQUEST (solicitud). */
export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  RESOLVED = "RESOLVED",
}
