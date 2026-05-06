import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AdminAccount } from "../admin-security/admin-account.entity";
import { AdminRole } from "../admin-security/enums/admin-role.enum";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import {
  ValidatableFile,
  validateChurchImage,
} from "../../common/validation/file-validation";
import { ChurchDirector } from "./church-director.entity";
import { Church } from "./church.entity";
import { CreateDirectorDto } from "./dto/create-director.dto";
import { UpdateDirectorDto } from "./dto/update-director.dto";

const DIRECTORS_FOLDER = "church-directors";

@Injectable()
export class DirectorsService {
  constructor(
    @InjectRepository(ChurchDirector)
    private readonly directorRepo: Repository<ChurchDirector>,
    @InjectRepository(Church)
    private readonly churchRepo: Repository<Church>,
    @InjectRepository(AdminAccount)
    private readonly accountRepo: Repository<AdminAccount>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /* ── Helpers ── */

  private assertScope(actor: AdminAccount, churchId: string) {
    if (actor.role === AdminRole.ROOT) return;
    if (actor.assignedChurchId !== churchId) {
      throw new ForbiddenException(
        "No tienes permiso para gestionar esta iglesia.",
      );
    }
  }

  /* ── Public ── */

  /**
   * Lista de directores visibles para una iglesia.
   * La foto resultante prefiere la del AdminAccount vinculado si existe.
   */
  async findPublicByChurch(churchId: string) {
    const directors = await this.directorRepo.find({
      where: { churchId },
      relations: { linkedAdminAccount: true },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });

    return directors.map((d) => ({
      id: d.id,
      displayName: d.displayName,
      role: d.role,
      photoUrl: d.linkedAdminAccount?.profilePhotoUrl ?? d.photoUrl ?? null,
    }));
  }

  /* ── Admin ── */

  async findAdminByChurch(churchId: string, actor: AdminAccount) {
    this.assertScope(actor, churchId);
    const directors = await this.directorRepo.find({
      where: { churchId },
      relations: { linkedAdminAccount: true },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });
    return directors.map((d) => ({
      id: d.id,
      churchId: d.churchId,
      displayName: d.displayName,
      role: d.role,
      photoUrl: d.photoUrl,
      linkedAdminAccountId: d.linkedAdminAccountId,
      linkedAdminPhotoUrl: d.linkedAdminAccount?.profilePhotoUrl ?? null,
      linkedAdminUsername: d.linkedAdminAccount?.username ?? null,
      sortOrder: d.sortOrder,
      createdAt: d.createdAt,
    }));
  }

  async create(
    churchId: string,
    dto: CreateDirectorDto,
    photo: ValidatableFile | null,
    actor: AdminAccount,
  ) {
    this.assertScope(actor, churchId);

    const church = await this.churchRepo.findOne({ where: { id: churchId } });
    if (!church) throw new NotFoundException("Iglesia no encontrada");

    if (dto.linkedAdminAccountId) {
      const linked = await this.accountRepo.findOne({
        where: { id: dto.linkedAdminAccountId },
      });
      if (!linked) throw new NotFoundException("Cuenta admin no encontrada");
      // Sólo se puede vincular una cuenta cuya iglesia asignada sea la misma
      // (o ROOT, que puede asignar cualquiera).
      if (
        actor.role !== AdminRole.ROOT &&
        linked.assignedChurchId !== churchId
      ) {
        throw new ForbiddenException(
          "Esa cuenta admin no pertenece a esta iglesia",
        );
      }
    }

    let photoUrl: string | null = null;
    let photoPublicId: string | null = null;
    if (photo) {
      validateChurchImage(photo);
      const uploaded = await this.cloudinary.uploadToFolder(
        photo.buffer,
        DIRECTORS_FOLDER,
      );
      photoUrl = uploaded.secure_url;
      photoPublicId = uploaded.public_id;
    }

    const director = this.directorRepo.create({
      churchId,
      displayName: dto.displayName.trim(),
      role: (dto.role ?? "").trim(),
      linkedAdminAccountId: dto.linkedAdminAccountId ?? null,
      photoUrl,
      photoPublicId,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.directorRepo.save(director);
  }

  async update(
    id: string,
    dto: UpdateDirectorDto,
    photo: ValidatableFile | null,
    actor: AdminAccount,
  ) {
    const director = await this.directorRepo.findOne({ where: { id } });
    if (!director) throw new NotFoundException("Director no encontrado");
    this.assertScope(actor, director.churchId);

    if (dto.displayName !== undefined)
      director.displayName = dto.displayName.trim();
    if (dto.role !== undefined) director.role = dto.role.trim();
    if (dto.sortOrder !== undefined) director.sortOrder = dto.sortOrder;
    if (dto.linkedAdminAccountId !== undefined) {
      director.linkedAdminAccountId = dto.linkedAdminAccountId ?? null;
    }

    if (photo) {
      validateChurchImage(photo);
      // Borrar la foto anterior si existía
      if (director.photoPublicId) {
        await this.cloudinary.delete(director.photoPublicId);
      }
      const uploaded = await this.cloudinary.uploadToFolder(
        photo.buffer,
        DIRECTORS_FOLDER,
      );
      director.photoUrl = uploaded.secure_url;
      director.photoPublicId = uploaded.public_id;
    }

    return this.directorRepo.save(director);
  }

  async remove(id: string, actor: AdminAccount) {
    const director = await this.directorRepo.findOne({ where: { id } });
    if (!director) throw new NotFoundException("Director no encontrado");
    this.assertScope(actor, director.churchId);

    if (director.photoPublicId) {
      await this.cloudinary.delete(director.photoPublicId);
    }

    await this.directorRepo.remove(director);
    return { deleted: true, id };
  }
}
