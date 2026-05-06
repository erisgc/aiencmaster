import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Imágenes que rotan como fondo de la vista pública del portal.
 * Las imágenes se almacenan en Cloudinary; aquí guardamos la URL y el publicId.
 */
@Entity("site_backgrounds")
export class SiteBackground {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  imageUrl!: string;

  @Column({ type: "text" })
  imagePublicId!: string;

  /** Versión recortada para móvil (opcional, generada por el admin). */
  @Column({ type: "text", nullable: true })
  mobileImageUrl!: string | null;

  @Column({ type: "text", nullable: true })
  mobileImagePublicId!: string | null;

  /** Etiqueta opcional para identificar la imagen en el panel. */
  @Column({ type: "text", default: "" })
  label!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
