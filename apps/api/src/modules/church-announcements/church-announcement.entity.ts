import {
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

import { AdminAccount } from "../admin-security/admin-account.entity";
import { Church } from "../churches/church.entity";
import { ChurchAnnouncementAttachment } from "./church-announcement-attachment.entity";

/**
 * Anuncio específico de una iglesia.
 *
 * Diferencia con `Announcement` (global):
 *  - Está vinculado a UNA iglesia.
 *  - Aparece en la página pública de esa iglesia, NO en el listado
 *    global de anuncios institucionales.
 *  - Requiere permiso MANAGE_CHURCH_ANNOUNCEMENTS sobre esa iglesia
 *    para crear/editar/eliminar.
 */
@Entity("church_announcements")
@Index(["churchId"])
@Index(["createdAt"])
export class ChurchAnnouncement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  churchId!: string;

  @ManyToOne(() => Church, { onDelete: "CASCADE" })
  @JoinColumn({ name: "churchId" })
  church!: Church;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  /** Nombre del autor mostrado al público (snapshot al crear). */
  @Column({ type: "text" })
  author!: string;

  @Column({ type: "uuid" })
  createdByAdminAccountId!: string;

  @ManyToOne(() => AdminAccount, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "createdByAdminAccountId" })
  createdByAdminAccount!: AdminAccount;

  @Column({ type: "uuid", nullable: true })
  lastUpdatedByAdminAccountId!: string | null;

  @OneToMany(() => ChurchAnnouncementAttachment, (att) => att.announcement, {
    cascade: true,
  })
  attachments!: ChurchAnnouncementAttachment[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
