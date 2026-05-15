import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { AdminActionLog } from "./admin-action-log.entity";
import { AdminAccessRequest } from "./admin-access-request.entity";
import { AdminChurchAssignment } from "./admin-church-assignment.entity";
import { AdminDevice } from "./admin_device.entity";
import { AdminRole } from "./enums/admin-role.enum";
import { GlobalPermission } from "./permissions/permission.enums";
import { Church } from "../churches/church.entity";

@Entity("admin_accounts")
@Index("IDX_admin_accounts_single_root", ["role"], {
  unique: true,
  where: `"role" = 'ROOT'`,
})
export class AdminAccount {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  passwordHash!: string;

  @Column()
  displayName!: string;

  @Column({
    type: "enum",
    enum: AdminRole,
    default: AdminRole.ADMIN,
  })
  role!: AdminRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 1 })
  tokenVersion!: number;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  /**
   * @deprecated Mantenido sólo por compatibilidad con la versión 1.
   * Las asignaciones ahora viven en `AdminChurchAssignment` (many-to-many).
   * Se eliminará en una migración futura.
   */
  @Column({ type: "uuid", nullable: true })
  assignedChurchId!: string | null;

  @ManyToOne(() => Church, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "assignedChurchId" })
  assignedChurch!: Church | null;

  /**
   * Permisos globales que el admin tiene sobre toda la plataforma.
   * ROOT siempre tiene todos por implícito (no se consulta esta lista
   * para ROOT). Para admins normales, está vacío por defecto.
   */
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  globalPermissions!: GlobalPermission[];

  /** Asignaciones admin ↔ iglesia con permisos por iglesia. */
  @OneToMany(
    () => AdminChurchAssignment,
    (assignment) => assignment.adminAccount,
  )
  churchAssignments!: AdminChurchAssignment[];

  /** Foto de perfil del admin (subida por la propia cuenta). */
  @Column({ type: "text", nullable: true })
  profilePhotoUrl!: string | null;

  @Column({ type: "text", nullable: true })
  profilePhotoPublicId!: string | null;

  @OneToMany(() => AdminDevice, (device) => device.adminAccount)
  devices!: AdminDevice[];

  @OneToMany(() => AdminAccessRequest, (request) => request.adminAccount)
  accessRequests!: AdminAccessRequest[];

  @OneToMany(() => AdminActionLog, (log) => log.actorAdminAccount)
  actionLogs!: AdminActionLog[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  @BeforeInsert()
  normalizeFields() {
    this.username = this.username.trim().toLowerCase();
    this.displayName = this.displayName.trim();
  }
}
