import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Configuración global del sitio (singleton: id = "default").
 * Guardamos opciones como el intervalo de rotación de los fondos públicos.
 */
@Entity("site_settings")
export class SiteSettings {
  /** Singleton: siempre "default" */
  @PrimaryColumn({ type: "text" })
  id!: string;

  /** Intervalo en segundos entre transiciones de fondo (1 imagen → siguiente). */
  @Column({ type: "int", default: 8 })
  backgroundIntervalSeconds!: number;

  /** Tiempo de fade de transición. */
  @Column({ type: "int", default: 1 })
  backgroundFadeSeconds!: number;

  /** Si es false, los fondos rotativos se ocultan en el portal público. */
  @Column({ type: "boolean", default: true })
  backgroundEnabled!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
