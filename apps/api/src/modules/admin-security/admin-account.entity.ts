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
import { AdminDevice } from "./admin_device.entity";
import { AdminRole } from "./enums/admin-role.enum";
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

  /** Iglesia asignada al admin. Null para ROOT (puede operar sobre cualquiera). */
  @Column({ type: "uuid", nullable: true })
  assignedChurchId!: string | null;

  @ManyToOne(() => Church, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "assignedChurchId" })
  assignedChurch!: Church | null;

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
