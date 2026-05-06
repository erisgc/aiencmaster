import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminSecurityModule } from "../admin-security/admin-security.module";
import { Church } from "../churches/church.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { Report } from "./report.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Report, Church]), AdminSecurityModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
