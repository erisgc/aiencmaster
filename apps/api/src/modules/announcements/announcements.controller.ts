import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from "@nestjs/common";

import { AdminAuthGuard } from "../admin-security/guards/admin-auth.guard";
import { AnnouncementsService } from "./announcements.service";

// Hard clamps para evitar DoS por paginación abusiva.
const MAX_PAGE_LIMIT = 50;
const DEFAULT_PAGE_LIMIT = 9;

@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get("latest")
  getLatest() {
    return this.service.findLatestFive();
  }

  @Get("admin/all")
  @UseGuards(AdminAuthGuard)
  findAllForAdmin() {
    return this.service.findAll();
  }

  @Get(":id")
  getById(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    return this.service.findOneById(id);
  }

  @Get()
  getPaginated(
    @Query("limit") limit = String(DEFAULT_PAGE_LIMIT),
    @Query("offset") offset = "0",
    @Query("title") title?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    const take = Number(limit);
    const skip = Number(offset);

    // Clamp limit a [1, MAX_PAGE_LIMIT], offset a >= 0.
    const safeLimit =
      Number.isFinite(take) && take > 0
        ? Math.min(Math.trunc(take), MAX_PAGE_LIMIT)
        : DEFAULT_PAGE_LIMIT;
    const safeOffset =
      Number.isFinite(skip) && skip >= 0 ? Math.trunc(skip) : 0;

    // Validación superficial de fechas ISO.
    const validFrom =
      fromDate && !Number.isNaN(Date.parse(fromDate)) ? fromDate : undefined;
    const validTo =
      toDate && !Number.isNaN(Date.parse(toDate)) ? toDate : undefined;

    // Título acotado para evitar queries ilimitadas.
    const safeTitle =
      typeof title === "string" &&
      title.trim().length > 0 &&
      title.length <= 200
        ? title.trim()
        : undefined;

    return this.service.findPaginatedWithFilters(
      safeLimit,
      safeOffset,
      safeTitle,
      validFrom,
      validTo,
    );
  }
}
