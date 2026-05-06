import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Announcement } from "./announcement.entity";

@Entity("announcement_attachments")
export class AnnouncementAttachment {
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

  @Column()
  size!: number;

  @ManyToOne(() => Announcement, (a: Announcement) => a.attachments, {
    onDelete: "CASCADE",
  })
  announcement!: Announcement;
}
