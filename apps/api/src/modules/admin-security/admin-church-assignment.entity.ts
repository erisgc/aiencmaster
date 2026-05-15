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

import { Church } from "../churches/church.entity";
import { AdminAccount } from "./admin-account.entity";
import { ChurchPermission } from "./permissions/permission.enums";

/**
 * Vínculo many-to-many entre administradores e iglesias.
 *
 * Un mismo admin puede estar asignado a varias iglesias con permisos
 * distintos en cada una. Los permisos por iglesia viven aquí, no en
 * AdminAccount, para que sean granulares por relación.
 *
 * Si el admin asignado es ROOT, esta tabla es informativa — el ROOT
 * tiene todos los permisos en todas las iglesias automáticamente.
 */
@Entity("admin_church_assignments")
@Index("IDX_admin_church_assignments_unique", ["adminAccountId", "churchId"], {
  unique: true,
})
export class AdminChurchAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  adminAccountId!: string;

  @ManyToOne(() => AdminAccount, { onDelete: "CASCADE" })
  @JoinColumn({ name: "adminAccountId" })
  adminAccount!: AdminAccount;

  @Column({ type: "uuid" })
  churchId!: string;

  @ManyToOne(() => Church, { onDelete: "CASCADE" })
  @JoinColumn({ name: "churchId" })
  church!: Church;

  /**
   * Lista de permisos por iglesia (subset de ChurchPermission).
   * Almacenado como jsonb array para flexibilidad sin migraciones
   * cuando se añadan nuevos permisos al enum.
   */
  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  permissions!: ChurchPermission[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
