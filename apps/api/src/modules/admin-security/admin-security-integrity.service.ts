import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AdminAccount } from "./admin-account.entity";
import { AdminDevice } from "./admin_device.entity";
import { AdminDeviceScope } from "./enums/admin-device-scope.enum";
import { AdminDeviceStatus } from "./enums/admin-device-status.enum";
import { AdminRole } from "./enums/admin-role.enum";

@Injectable()
export class AdminSecurityIntegrityService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSecurityIntegrityService.name);

  constructor(
    @InjectRepository(AdminAccount)
    private readonly accountRepo: Repository<AdminAccount>,
    @InjectRepository(AdminDevice)
    private readonly deviceRepo: Repository<AdminDevice>,
  ) {}

  async onApplicationBootstrap() {
    const bootstrapEnabled = process.env.ADMIN_BOOTSTRAP_ENABLED === "true";
    const rootRecoveryEnabled =
      process.env.ADMIN_ROOT_RECOVERY_ENABLED === "true";

    const rootCount = await this.accountRepo.count({
      where: { role: AdminRole.ROOT },
    });

    if (rootCount > 1) {
      throw new Error(
        "Invalid admin security state: multiple ROOT accounts were found.",
      );
    }

    const rootDevices = await this.deviceRepo.find({
      where: {
        roleScope: AdminDeviceScope.ROOT_DEVICE,
      },
      relations: { adminAccount: true },
    });

    if (rootDevices.length > 1) {
      throw new Error(
        "Invalid admin security state: multiple ROOT_DEVICE records were found.",
      );
    }

    const rootDevice = rootDevices[0];
    if (rootDevice && rootCount === 0) {
      throw new Error(
        "Invalid admin security state: a ROOT_DEVICE exists without a ROOT account.",
      );
    }

    if (rootDevice && rootDevice.status !== AdminDeviceStatus.APPROVED) {
      throw new Error(
        "Invalid admin security state: the ROOT_DEVICE must stay approved.",
      );
    }

    if (rootDevice && rootDevice.adminAccount?.role !== AdminRole.ROOT) {
      throw new Error(
        "Invalid admin security state: the ROOT_DEVICE is not bound to the ROOT account.",
      );
    }

    if (rootCount === 1 && !rootDevice) {
      this.logger.warn(
        "A ROOT account exists without an approved ROOT_DEVICE. Root recovery may be required.",
      );
    }

    if (bootstrapEnabled && rootCount > 0) {
      this.logger.warn(
        "ADMIN_BOOTSTRAP_ENABLED remains active even though a ROOT account already exists. Disable it after exceptional use.",
      );
    }

    if (bootstrapEnabled && rootCount === 0) {
      this.logger.warn(
        "ADMIN_BOOTSTRAP_ENABLED is active for initial setup. Disable it immediately after provisioning the first ROOT account.",
      );
    }

    if (rootRecoveryEnabled) {
      this.logger.warn(
        "ADMIN_ROOT_RECOVERY_ENABLED is active. Keep it disabled unless a break-glass root recovery is being performed.",
      );
    }
  }
}
