import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminSecurityModule } from "../admin-security/admin-security.module";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { AdminSiteController, PublicSiteController } from "./site.controller";
import { SiteBackground } from "./site-background.entity";
import { SiteService } from "./site.service";
import { SiteSettings } from "./site-settings.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([SiteBackground, SiteSettings]),
    AdminSecurityModule,
    CloudinaryModule,
  ],
  controllers: [PublicSiteController, AdminSiteController],
  providers: [SiteService],
})
export class SiteModule {}
