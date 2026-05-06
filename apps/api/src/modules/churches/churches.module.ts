import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminAccount } from "../admin-security/admin-account.entity";
import { AdminSecurityModule } from "../admin-security/admin-security.module";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { AdminChurchesController } from "./admin-churches.controller";
import {
  AdminDirectorByIdController,
  AdminDirectorsController,
} from "./directors.controller";
import { ChurchDirector } from "./church-director.entity";
import { Church } from "./church.entity";
import { ChurchesService } from "./churches.service";
import { DirectorsService } from "./directors.service";
import { PublicChurchesController } from "./public-churches.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Church, ChurchDirector, AdminAccount]),
    CloudinaryModule,
    AdminSecurityModule,
  ],
  controllers: [
    PublicChurchesController,
    AdminChurchesController,
    AdminDirectorsController,
    AdminDirectorByIdController,
  ],
  providers: [ChurchesService, DirectorsService],
  exports: [ChurchesService, DirectorsService],
})
export class ChurchesModule {}
