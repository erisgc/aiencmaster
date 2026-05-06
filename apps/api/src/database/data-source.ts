import "reflect-metadata";

import { DataSource } from "typeorm";

import { Announcement } from "../modules/announcements/announcement.entity";
import { AnnouncementAttachment } from "../modules/announcements/attachment.entity";
import { AdminAccount } from "../modules/admin-security/admin-account.entity";
import { AdminAccessRequest } from "../modules/admin-security/admin-access-request.entity";
import { AdminActionLog } from "../modules/admin-security/admin-action-log.entity";
import { AdminDevice } from "../modules/admin-security/admin_device.entity";
import { AdminInvitation } from "../modules/admin-security/admin-invitation.entity";
import { ChurchDirector } from "../modules/churches/church-director.entity";
import { Church } from "../modules/churches/church.entity";
import { Report } from "../modules/reports/report.entity";
import { SiteBackground } from "../modules/site/site-background.entity";
import { SiteSettings } from "../modules/site/site-settings.entity";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }

  return value;
}

function requiredPositiveInt(name: string) {
  const value = Number(required(name));
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

const ENTITIES = [
  AdminAccount,
  AdminDevice,
  AdminAccessRequest,
  AdminActionLog,
  AdminInvitation,
  Announcement,
  AnnouncementAttachment,
  Church,
  ChurchDirector,
  Report,
  SiteBackground,
  SiteSettings,
];

const databaseUrl = process.env.DATABASE_URL?.trim();

const appDataSource = databaseUrl
  ? new DataSource({
      type: "postgres",
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
      entities: ENTITIES,
      migrations: ["src/database/migrations/*{.ts,.js}"],
      synchronize: false,
    })
  : new DataSource({
      type: "postgres",
      host: required("DB_HOST"),
      port: requiredPositiveInt("DB_PORT"),
      username: required("DB_USERNAME"),
      password: required("DB_PASSWORD"),
      database: required("DB_NAME"),
      entities: ENTITIES,
      migrations: ["src/database/migrations/*{.ts,.js}"],
      synchronize: false,
    });

export default appDataSource;
