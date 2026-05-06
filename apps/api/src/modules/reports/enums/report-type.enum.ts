/**
 * Tipos de informe que la administración de cada iglesia puede generar.
 * Extender aquí permite agregar nuevos tipos sin migraciones de tablas
 * (los datos específicos viven en `data` jsonb).
 */
export enum ReportType {
  /** Ingresos por ofrendas (mensual/semanal). */
  OFFERINGS = "OFFERINGS",
  /** Conteo de asistentes. */
  ATTENDANCE = "ATTENDANCE",
  /** Egresos (gastos operativos, servicios, etc.). */
  EXPENSES = "EXPENSES",
  /** Eventos especiales (campañas, retiros, conferencias). */
  EVENT = "EVENT",
  /** Otro tipo libre. */
  OTHER = "OTHER",
}
