import { Module } from "@nestjs/common";
import { TypeOrmModule, type TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { validateEnvironment } from "./config/environment.validation";
import { AdminSecurityModule } from "./modules/admin-security/admin-security.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { ChurchAnnouncementsModule } from "./modules/church-announcements/church-announcements.module";
import { ChurchesModule } from "./modules/churches/churches.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SiteModule } from "./modules/site/site.module";

/**
 * En producción aceptamos un único `DATABASE_URL` (Neon, Railway, Supabase…).
 * En desarrollo seguimos usando los DB_* sueltos.
 *
 * Algunos proveedores requieren SSL: si la URL no incluye `sslmode=require`
 * activamos `ssl` con `rejectUnauthorized: false` para Neon/Supabase.
 */
function buildTypeOrmOptions(): TypeOrmModuleOptions {
  const isProd = process.env.NODE_ENV === "production";
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const wantsSync = process.env.DB_SYNCHRONIZE === "true";

  if (isProd && wantsSync) {
    // Aviso explícito: en producción se debería usar migraciones.
    // Permitimos `synchronize` solo para la primera deploy; después
    // se debe poner DB_SYNCHRONIZE=false.

    console.warn(
      "[TypeORM] DB_SYNCHRONIZE=true en producción. Desactívalo después de crear el esquema inicial.",
    );
  }

  const base: Partial<TypeOrmModuleOptions> = {
    type: "postgres",
    autoLoadEntities: true,
    synchronize: wantsSync,
  };

  if (databaseUrl) {
    return {
      ...base,
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
    } as TypeOrmModuleOptions;
  }

  return {
    ...base,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  } as TypeOrmModuleOptions;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRoot(buildTypeOrmOptions()),
    AdminSecurityModule,
    AnnouncementsModule,
    ChurchAnnouncementsModule,
    ChurchesModule,
    ReportsModule,
    SiteModule,
  ],
})
export class AppModule {}
