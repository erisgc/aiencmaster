import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { AdminAccount } from "./admin-account.entity";
import { AdminDeviceScope } from "./enums/admin-device-scope.enum";
import { AdminDeviceStatus } from "./enums/admin-device-status.enum";

@Entity("admin_devices")
@Index("IDX_admin_devices_single_root_device", ["roleScope"], {
  unique: true,
  where: `"roleScope" = 'ROOT_DEVICE'`,
})
@Check(
  "CHK_admin_devices_approved_requires_binding",
  `"status" <> 'APPROVED' OR ("adminAccountId" IS NOT NULL AND "approvedAt" IS NOT NULL)`,
)
@Check(
  "CHK_admin_devices_revoked_requires_timestamp",
  `"status" <> 'REVOKED' OR "revokedAt" IS NOT NULL`,
)
@Check(
  "CHK_admin_devices_root_device_requires_binding",
  `"roleScope" <> 'ROOT_DEVICE' OR ("adminAccountId" IS NOT NULL AND "approvedAt" IS NOT NULL)`,
)
@Check(
  "CHK_admin_devices_root_device_must_be_approved",
  `"roleScope" <> 'ROOT_DEVICE' OR "status" = 'APPROVED'`,
)
export class AdminDevice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", nullable: true })
  adminAccountId!: string | null;

  @ManyToOne(() => AdminAccount, (account) => account.devices, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "adminAccountId" })
  adminAccount!: AdminAccount | null;

  @Column({ type: "text", unique: true })
  deviceId!: string;

  @Column({ type: "text", nullable: true })
  trustedTokenHash!: string | null;

  @Column({ type: "text" })
  deviceName!: string;

  @Column({ type: "text", default: "" })
  platform!: string;

  @Column({ type: "text", default: "" })
  browser!: string;

  @Column({ type: "text", default: "" })
  userAgent!: string;

  @Column({ type: "text", nullable: true })
  ipLastSeen!: string | null;

  @Column({
    type: "enum",
    enum: AdminDeviceScope,
    default: AdminDeviceScope.APPROVED_DEVICE,
  })
  roleScope!: AdminDeviceScope;

  @Column({
    type: "enum",
    enum: AdminDeviceStatus,
    default: AdminDeviceStatus.PENDING,
  })
  status!: AdminDeviceStatus;

  @Column({ type: "text", nullable: true })
  approvedByDeviceId!: string | null;

  @ManyToOne(() => AdminDevice, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "approvedByDeviceId" })
  approvedByDevice!: AdminDevice | null;

  @Column({ type: "timestamptz", nullable: true })
  approvedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
