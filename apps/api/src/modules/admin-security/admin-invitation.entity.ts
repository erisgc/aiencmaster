import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import type {
  ChurchPermission,
  GlobalPermission,
} from "./permissions/permission.enums";

export enum AdminInvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

/**
 * Invitación generada por ROOT para crear una nueva cuenta de admin.
 * Permite enviar un link único al cliente con token de un solo uso.
 */
@Entity("admin_invitations")
@Index(["status"])
export class AdminInvitation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Hash SHA-256 del token entregado al destinatario (no se guarda el token plano). */
  @Column({ type: "text", unique: true })
  tokenHash!: string;

  /** Username pre-asignado para la cuenta (se valida al aceptar). */
  @Column({ type: "text" })
  username!: string;

  /** Nombre visible pre-asignado. */
  @Column({ type: "text" })
  displayName!: string;

  /** Iglesia que el admin podrá administrar. */
  @Column({ type: "uuid" })
  assignedChurchId!: string;

  /**
   * Permisos por iglesia pre-asignados. Se aplican al aceptar la
   * invitación creando un AdminChurchAssignment con estos permisos.
   */
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  churchPermissions!: ChurchPermission[];

  /**
   * Permisos globales pre-asignados (opcional). Si el ROOT quiere
   * delegar algún permiso global desde el inicio.
   */
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  globalPermissions!: GlobalPermission[];

  /** Quién creó la invitación (ROOT). */
  @Column({ type: "uuid" })
  createdByAdminAccountId!: string;

  @Column({
    type: "enum",
    enum: AdminInvitationStatus,
    default: AdminInvitationStatus.PENDING,
  })
  status!: AdminInvitationStatus;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  acceptedAt!: Date | null;

  /** AdminAccount creado al aceptar (referencia opcional). */
  @Column({ type: "uuid", nullable: true })
  acceptedByAdminAccountId!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
