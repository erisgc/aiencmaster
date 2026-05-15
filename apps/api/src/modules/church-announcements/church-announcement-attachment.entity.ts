import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ChurchAnnouncement } from "./church-announcement.entity";

@Entity("church_announcement_attachments")
export class ChurchAnnouncementAttachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  publicId!: string;

  @Column()
  url!: string;

  @Column()
  resourceType!: string;

  @Column()
  format!: string;

  @Column()
  name!: string;

  @Column({ type: "bigint" })
  size!: number;

  @ManyToOne(() => ChurchAnnouncement, (a) => a.attachments, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  announcement!: ChurchAnnouncement;
}
