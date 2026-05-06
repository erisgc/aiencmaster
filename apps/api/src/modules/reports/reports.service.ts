import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";

import { AdminAccount } from "../admin-security/admin-account.entity";
import { AdminRole } from "../admin-security/enums/admin-role.enum";
import { Church } from "../churches/church.entity";
import { CreateReportDto } from "./dto/create-report.dto";
import { QueryReportsDto } from "./dto/query-reports.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { ReportType } from "./enums/report-type.enum";
import { Report } from "./report.entity";

const MAX_DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Church)
    private readonly churchRepo: Repository<Church>,
  ) {}

  /* ── Helpers ── */

  private assertScope(actor: AdminAccount, churchId: string) {
    if (actor.role === AdminRole.ROOT) return;
    if (actor.assignedChurchId !== churchId) {
      throw new ForbiddenException(
        "No tienes permiso para operar sobre esta iglesia.",
      );
    }
  }

  private validateData(reportType: ReportType, data: Record<string, unknown>) {
    if (!data || typeof data !== "object") {
      throw new BadRequestException("data debe ser un objeto");
    }

    switch (reportType) {
      case ReportType.OFFERINGS:
      case ReportType.EXPENSES: {
        const total = Number((data as { totalCop?: unknown }).totalCop);
        if (!Number.isFinite(total) || total < 0) {
          throw new BadRequestException(
            "data.totalCop debe ser un número >= 0",
          );
        }
        break;
      }
      case ReportType.ATTENDANCE: {
        const count = Number((data as { count?: unknown }).count);
        if (!Number.isInteger(count) || count < 0) {
          throw new BadRequestException("data.count debe ser entero >= 0");
        }
        break;
      }
      case ReportType.EVENT: {
        const raw = (data as { name?: unknown }).name;
        const name = typeof raw === "string" ? raw.trim() : "";
        if (!name || name.length > 200) {
          throw new BadRequestException(
            "data.name es obligatorio (máx 200 caracteres)",
          );
        }
        break;
      }
      case ReportType.OTHER: {
        const raw = (data as { freeText?: unknown }).freeText;
        const free = typeof raw === "string" ? raw : "";
        if (free.length > 8000) {
          throw new BadRequestException(
            "data.freeText excede el máximo (8000 caracteres)",
          );
        }
        break;
      }
    }
  }

  /* ── CRUD ── */

  async create(dto: CreateReportDto, actor: AdminAccount): Promise<Report> {
    this.assertScope(actor, dto.churchId);
    this.validateData(dto.reportType, dto.data);

    const church = await this.churchRepo.findOne({
      where: { id: dto.churchId },
    });
    if (!church) {
      throw new NotFoundException("Iglesia no encontrada");
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd < periodStart) {
      throw new BadRequestException(
        "periodEnd no puede ser anterior a periodStart",
      );
    }

    const entity = this.reportRepo.create({
      churchId: dto.churchId,
      reportType: dto.reportType,
      title: dto.title.trim(),
      notes: (dto.notes ?? "").trim(),
      periodStart,
      periodEnd,
      data: dto.data,
      createdByAdminAccountId: actor.id,
      createdByDisplayName: actor.displayName,
      lastUpdatedByAdminAccountId: null,
      lastUpdatedByDisplayName: null,
    });

    return this.reportRepo.save(entity);
  }

  async findAll(query: QueryReportsDto, actor: AdminAccount) {
    const where: FindOptionsWhere<Report> = {};

    // Scope: admins solo ven informes de su iglesia
    if (actor.role !== AdminRole.ROOT) {
      if (!actor.assignedChurchId) {
        return { items: [], total: 0 };
      }
      where.churchId = actor.assignedChurchId;
    } else if (query.churchId) {
      where.churchId = query.churchId;
    }

    if (query.reportType) {
      where.reportType = query.reportType;
    }

    if (query.fromDate && query.toDate) {
      where.periodStart = Between(
        new Date(query.fromDate),
        new Date(query.toDate),
      );
    } else if (query.fromDate) {
      where.periodStart = MoreThanOrEqual(new Date(query.fromDate));
    } else if (query.toDate) {
      where.periodStart = LessThanOrEqual(new Date(query.toDate));
    }

    const limit = Math.min(MAX_LIMIT, query.limit ?? MAX_DEFAULT_LIMIT);
    const offset = query.offset ?? 0;

    const [items, total] = await this.reportRepo.findAndCount({
      where,
      relations: ["church"],
      order: { periodStart: "DESC", createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return { items, total };
  }

  async findOne(id: string, actor: AdminAccount): Promise<Report> {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ["church", "createdByAdminAccount"],
    });
    if (!report) {
      throw new NotFoundException("Informe no encontrado");
    }
    this.assertScope(actor, report.churchId);
    return report;
  }

  async update(
    id: string,
    dto: UpdateReportDto,
    actor: AdminAccount,
  ): Promise<Report> {
    const report = await this.findOne(id, actor);

    // Si cambian la iglesia, validar también el scope sobre la nueva.
    if (dto.churchId && dto.churchId !== report.churchId) {
      this.assertScope(actor, dto.churchId);
    }

    if (dto.data && (dto.reportType ?? report.reportType)) {
      this.validateData(dto.reportType ?? report.reportType, dto.data);
    }

    if (dto.periodStart && dto.periodEnd) {
      if (new Date(dto.periodEnd) < new Date(dto.periodStart)) {
        throw new BadRequestException(
          "periodEnd no puede ser anterior a periodStart",
        );
      }
    }

    Object.assign(report, {
      ...(dto.churchId && { churchId: dto.churchId }),
      ...(dto.reportType && { reportType: dto.reportType }),
      ...(dto.title !== undefined && { title: dto.title.trim() }),
      ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
      ...(dto.periodStart && { periodStart: new Date(dto.periodStart) }),
      ...(dto.periodEnd && { periodEnd: new Date(dto.periodEnd) }),
      ...(dto.data && { data: dto.data }),
      lastUpdatedByAdminAccountId: actor.id,
      lastUpdatedByDisplayName: actor.displayName,
    });

    return this.reportRepo.save(report);
  }

  async remove(id: string, actor: AdminAccount) {
    const report = await this.findOne(id, actor);
    await this.reportRepo.remove(report);
    return { deleted: true, id };
  }
}
