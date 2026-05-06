import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Announcement } from "./announcement.entity";
import { AnnouncementAttachment } from "./attachment.entity";
import { AnnouncementsService } from "./announcements.service";
import { AnnouncementsController } from "./announcements.controller";
import { AdminAnnouncementsController } from "./admin-announcements.controller";
import { AdminSecurityModule } from "../admin-security/admin-security.module";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement, AnnouncementAttachment]),
    CloudinaryModule,
    AdminSecurityModule,
  ],
  providers: [AnnouncementsService],
  controllers: [AnnouncementsController, AdminAnnouncementsController],
})
export class AnnouncementsModule {}
