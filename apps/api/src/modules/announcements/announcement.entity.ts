import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";

import { AnnouncementAttachment } from "./attachment.entity";

@Entity("announcements")
export class Announcement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column()
  author!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(
    () => AnnouncementAttachment,
    (att: AnnouncementAttachment) => att.announcement,
    { cascade: true },
  )
  attachments!: AnnouncementAttachment[];
}
