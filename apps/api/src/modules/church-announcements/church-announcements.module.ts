import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminChurchAssignment } from "../admin-security/admin-church-assignment.entity";
import { AdminSecurityModule } from "../admin-security/admin-security.module";
import { PermissionsService } from "../admin-security/permissions/permissions.service";
import { Church } from "../churches/church.entity";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { ChurchAnnouncementAttachment } from "./church-announcement-attachment.entity";
import { ChurchAnnouncement } from "./church-announcement.entity";
import {
  AdminChurchAnnouncementsController,
  PublicChurchAnnouncementsController,
} from "./church-announcements.controllers";
import { ChurchAnnouncementsService } from "./church-announcements.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChurchAnnouncement,
      ChurchAnnouncementAttachment,
      Church,
      AdminChurchAssignment,
    ]),
    AdminSecurityModule,
    CloudinaryModule,
  ],
  controllers: [
    AdminChurchAnnouncementsController,
    PublicChurchAnnouncementsController,
  ],
  providers: [ChurchAnnouncementsService, PermissionsService],
})
export class ChurchAnnouncementsModule {}
