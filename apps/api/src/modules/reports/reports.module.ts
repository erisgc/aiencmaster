import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminChurchAssignment } from "../admin-security/admin-church-assignment.entity";
import { AdminSecurityModule } from "../admin-security/admin-security.module";
import { PermissionsService } from "../admin-security/permissions/permissions.service";
import { Church } from "../churches/church.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { Report } from "./report.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Church, AdminChurchAssignment]),
    AdminSecurityModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, PermissionsService],
})
export class ReportsModule {}
