import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AdminAccount } from "./admin-account.entity";
import { AdminDevice } from "./admin_device.entity";

@Entity("admin_action_logs")
export class AdminActionLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", nullable: true })
  actorAdminAccountId!: string | null;

  @ManyToOne(() => AdminAccount, (account) => account.actionLogs, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "actorAdminAccountId" })
  actorAdminAccount!: AdminAccount | null;

  @Column({ type: "text", nullable: true })
  actorDeviceId!: string | null;

  @ManyToOne(() => AdminDevice, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "actorDeviceId" })
  actorDevice!: AdminDevice | null;

  @Column({ type: "text" })
  actionType!: string;

  @Column({ type: "text" })
  targetType!: string;

  @Column({ type: "text", nullable: true })
  targetId!: string | null;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text", nullable: true })
  ip!: string | null;

  @Column({ type: "text", default: "" })
  userAgent!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
