import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { AdminAccount } from "../admin-security/admin-account.entity";
import { Church } from "../churches/church.entity";
import { ReportType } from "./enums/report-type.enum";

/**
 * Informe generado por la administración de una iglesia.
 * Pensado para reportes a la DIAN: ofrendas, asistencia, egresos, eventos.
 *
 * El campo `data` (jsonb) hace el modelo escalable a cualquier tipo de
 * informe sin migraciones — la forma exacta se valida en los DTOs.
 *
 * Cada informe queda asociado al admin que lo creó (`createdByAdminAccountId`)
 * y la última edición se registra en `lastUpdatedByAdminAccountId` para
 * trazabilidad ante auditorías.
 */
@Entity("reports")
@Index(["churchId", "reportType"])
@Index(["periodStart"])
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  churchId!: string;

  @ManyToOne(() => Church, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "churchId" })
  church!: Church;

  @Column({ type: "enum", enum: ReportType })
  reportType!: ReportType;

  /** Título descriptivo (ej. "Ofrendas mes de Marzo 2026"). */
  @Column({ type: "text" })
  title!: string;

  /** Notas / observaciones libres. */
  @Column({ type: "text", default: "" })
  notes!: string;

  /** Inicio del período cubierto por el informe. */
  @Column({ type: "timestamptz" })
  periodStart!: Date;

  /** Fin del período cubierto por el informe. */
  @Column({ type: "timestamptz" })
  periodEnd!: Date;

  /**
   * Datos específicos del tipo de informe (jsonb).
   * Estructura validada en los DTOs según `reportType`:
   *  - OFFERINGS:   { totalCop: number, breakdown?: Array<{label, amount}> }
   *  - ATTENDANCE:  { count: number, sessions?: Array<{date, count}> }
   *  - EXPENSES:    { totalCop: number, items?: Array<{label, amount}> }
   *  - EVENT:       { name: string, attendees?: number, summary?: string }
   *  - OTHER:       { freeText: string }
   */
  @Column({ type: "jsonb" })
  data!: Record<string, unknown>;

  /* ── Trazabilidad ── */

  @Column({ type: "uuid" })
  createdByAdminAccountId!: string;

  @ManyToOne(() => AdminAccount, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdByAdminAccountId" })
  createdByAdminAccount!: AdminAccount;

  /** Cache del nombre visible del autor al momento de creación (snapshot). */
  @Column({ type: "text" })
  createdByDisplayName!: string;

  @Column({ type: "uuid", nullable: true })
  lastUpdatedByAdminAccountId!: string | null;

  @Column({ type: "text", nullable: true })
  lastUpdatedByDisplayName!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
