import { PartialType } from "@nestjs/mapped-types";
import { CreateChurchAnnouncementDto } from "./create-church-announcement.dto";

export class UpdateChurchAnnouncementDto extends PartialType(
  CreateChurchAnnouncementDto,
) {}
