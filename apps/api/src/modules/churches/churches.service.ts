import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Church } from "./church.entity";
import { CreateChurchDto } from "./dto/create-church.dto";
import { UpdateChurchDto } from "./dto/update-church.dto";

import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { DirectorsService } from "./directors.service";

type IncomingFile = {
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

@Injectable()
export class ChurchesService {
  constructor(
    @InjectRepository(Church)
    private readonly repo: Repository<Church>,

    private readonly cloudinary: CloudinaryService,
    private readonly directorsService: DirectorsService,
  ) {}

  async findAllPublic() {
    const churches = await this.repo.find({
      order: { createdAt: "ASC" },
    });

    // Para iglesias inactivas solo exponemos campos públicos mínimos.
    // Las activas conservan todos sus datos.
    return churches.map((church) => {
      if (church.isActive) return church;

      return {
        id: church.id,
        name: church.name,
        isActive: false,
        createdAt: church.createdAt,
        updatedAt: church.updatedAt,
      };
    });
  }

  async findOnePublic(id: string) {
    const entity = await this.repo.findOne({
      where: { id, isActive: true },
    });

    if (!entity) {
      throw new NotFoundException("Church not found");
    }

    const directors = await this.directorsService.findPublicByChurch(id);

    return { ...entity, directors };
  }

  findAllForAdmin() {
    return this.repo.find({
      order: { createdAt: "ASC" },
    });
  }

  async findByIdForAdmin(id: string) {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException("Church not found");
    }

    return entity;
  }

  async toggleActive(id: string) {
    const entity = await this.findByIdForAdmin(id);
    entity.isActive = !entity.isActive;
    return this.repo.save(entity);
  }

  async create(
    dto: CreateChurchDto,
    files?: {
      mainImage?: IncomingFile;
      coverImage?: IncomingFile;
    },
  ) {
    const uploadedPublicIds: string[] = [];

    try {
      if (files?.mainImage) {
        const upload = await this.cloudinary.uploadToFolder(
          files.mainImage.buffer,
          "churches",
        );

        uploadedPublicIds.push(upload.public_id);
        dto.mainImageUrl = upload.secure_url;
        dto.mainImagePublicId = upload.public_id;
      }

      if (files?.coverImage) {
        const upload = await this.cloudinary.uploadToFolder(
          files.coverImage.buffer,
          "churches",
        );

        uploadedPublicIds.push(upload.public_id);
        dto.coverImageUrl = upload.secure_url;
        dto.coverImagePublicId = upload.public_id;
      }

      const entity = this.repo.create(dto);
      return this.repo.save(entity);
    } catch (err) {
      for (const publicId of uploadedPublicIds) {
        try {
          await this.cloudinary.delete(publicId);
        } catch {
          // Preserve the original failure if cleanup also fails.
        }
      }
      throw err;
    }
  }

  async update(
    id: string,
    dto: UpdateChurchDto,
    files?: {
      mainImage?: IncomingFile;
      coverImage?: IncomingFile;
    },
  ) {
    const entity = await this.findByIdForAdmin(id);

    if (files?.mainImage) {
      if (entity.mainImagePublicId) {
        try {
          await this.cloudinary.delete(entity.mainImagePublicId);
        } catch {
          // Keep the current tolerant behavior for external cleanup.
        }
      }

      const upload = await this.cloudinary.uploadToFolder(
        files.mainImage.buffer,
        "churches",
      );

      entity.mainImageUrl = upload.secure_url;
      entity.mainImagePublicId = upload.public_id;
    }

    if (files?.coverImage) {
      if (entity.coverImagePublicId) {
        try {
          await this.cloudinary.delete(entity.coverImagePublicId);
        } catch {
          // Keep the current tolerant behavior for external cleanup.
        }
      }

      const upload = await this.cloudinary.uploadToFolder(
        files.coverImage.buffer,
        "churches",
      );

      entity.coverImageUrl = upload.secure_url;
      entity.coverImagePublicId = upload.public_id;
    }

    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findByIdForAdmin(id);

    const publicIds = [
      entity.mainImagePublicId,
      entity.coverImagePublicId,
    ].filter(Boolean) as string[];

    for (const publicId of publicIds) {
      try {
        await this.cloudinary.delete(publicId);
      } catch {
        // Keep the current tolerant behavior for external cleanup.
      }
    }

    await this.repo.remove(entity);
    return { deleted: true, id };
  }
}
