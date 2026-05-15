import { randomBytes, createHash } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";

import { Church } from "../churches/church.entity";
import { AdminAccount } from "./admin-account.entity";
import { AdminChurchAssignment } from "./admin-church-assignment.entity";
import {
  AdminInvitation,
  AdminInvitationStatus,
} from "./admin-invitation.entity";
import { AdminRole } from "./enums/admin-role.enum";
import {
  ALL_CHURCH_PERMISSIONS,
  ChurchPermission,
  GlobalPermission,
} from "./permissions/permission.enums";

const INVITATION_TTL_HOURS = 72;
const TOKEN_BYTES = 32;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export interface CreateInvitationInput {
  username: string;
  displayName: string;
  assignedChurchId: string;
  createdByAdminAccountId: string;
  /** Permisos pre-asignados sobre la iglesia. Si no se envía, se usan todos. */
  churchPermissions?: ChurchPermission[];
  /** Permisos globales pre-asignados (opcional). */
  globalPermissions?: GlobalPermission[];
}

export interface InvitationWithToken {
  id: string;
  token: string;
  username: string;
  displayName: string;
  assignedChurchId: string;
  expiresAt: Date;
}

@Injectable()
export class AdminInvitationsService {
  constructor(
    @InjectRepository(AdminInvitation)
    private readonly invitationRepo: Repository<AdminInvitation>,
    @InjectRepository(AdminAccount)
    private readonly accountRepo: Repository<AdminAccount>,
    @InjectRepository(Church)
    private readonly churchRepo: Repository<Church>,
    @InjectRepository(AdminChurchAssignment)
    private readonly assignmentRepo: Repository<AdminChurchAssignment>,
  ) {}

  async create(input: CreateInvitationInput): Promise<InvitationWithToken> {
    const usernameNorm = input.username.trim().toLowerCase();
    if (
      !/^[a-zA-Z0-9_.-]+$/.test(usernameNorm) ||
      usernameNorm.length < 3 ||
      usernameNorm.length > 50
    ) {
      throw new BadRequestException(
        "Usuario inválido (3–50 caracteres, sólo letras, números, '_', '.' y '-')",
      );
    }

    const displayName = input.displayName.trim();
    if (displayName.length < 2 || displayName.length > 100) {
      throw new BadRequestException(
        "Nombre visible inválido (entre 2 y 100 caracteres)",
      );
    }

    const existingAccount = await this.accountRepo.findOne({
      where: { username: usernameNorm },
    });
    if (existingAccount) {
      throw new ConflictException("El nombre de usuario ya está en uso");
    }

    const church = await this.churchRepo.findOne({
      where: { id: input.assignedChurchId },
    });
    if (!church) {
      throw new NotFoundException("Iglesia no encontrada");
    }

    const existingPending = await this.invitationRepo.findOne({
      where: {
        username: usernameNorm,
        status: AdminInvitationStatus.PENDING,
      },
    });
    if (existingPending) {
      throw new ConflictException(
        "Ya existe una invitación pendiente para ese usuario",
      );
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 3600 * 1000);

    const invitation = this.invitationRepo.create({
      tokenHash,
      username: usernameNorm,
      displayName,
      assignedChurchId: input.assignedChurchId,
      churchPermissions:
        input.churchPermissions ?? [...ALL_CHURCH_PERMISSIONS],
      globalPermissions: input.globalPermissions ?? [],
      createdByAdminAccountId: input.createdByAdminAccountId,
      status: AdminInvitationStatus.PENDING,
      expiresAt,
    });

    const saved = await this.invitationRepo.save(invitation);

    return {
      id: saved.id,
      token,
      username: saved.username,
      displayName: saved.displayName,
      assignedChurchId: saved.assignedChurchId,
      expiresAt: saved.expiresAt,
    };
  }

  async list() {
    const invitations = await this.invitationRepo.find({
      order: { createdAt: "DESC" },
    });

    // Adjuntamos el nombre de la iglesia para que el panel ROOT pueda mostrarlo.
    const churchIds = invitations.map((inv) => inv.assignedChurchId);
    const churches = churchIds.length
      ? await this.churchRepo.find({ where: churchIds.map((id) => ({ id })) })
      : [];
    const churchMap = new Map(churches.map((c) => [c.id, c.name]));

    return invitations.map((inv) => ({
      id: inv.id,
      username: inv.username,
      displayName: inv.displayName,
      assignedChurchId: inv.assignedChurchId,
      assignedChurchName: churchMap.get(inv.assignedChurchId) ?? null,
      status: inv.status,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      createdAt: inv.createdAt,
    }));
  }

  async revoke(id: string) {
    const invitation = await this.invitationRepo.findOne({ where: { id } });
    if (!invitation) {
      throw new NotFoundException("Invitación no encontrada");
    }
    if (invitation.status !== AdminInvitationStatus.PENDING) {
      throw new BadRequestException("La invitación ya no está pendiente");
    }
    invitation.status = AdminInvitationStatus.REVOKED;
    await this.invitationRepo.save(invitation);
    return { id, status: AdminInvitationStatus.REVOKED };
  }

  /** Vista pública del estado de un token (sin requerir auth). */
  async preview(token: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.invitationRepo.findOne({
      where: { tokenHash },
    });
    if (!invitation) {
      throw new NotFoundException("Invitación inválida");
    }
    if (invitation.status !== AdminInvitationStatus.PENDING) {
      return { valid: false, status: invitation.status };
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = AdminInvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      return { valid: false, status: AdminInvitationStatus.EXPIRED };
    }

    const church = await this.churchRepo.findOne({
      where: { id: invitation.assignedChurchId },
    });

    return {
      valid: true,
      status: AdminInvitationStatus.PENDING,
      username: invitation.username,
      displayName: invitation.displayName,
      churchName: church?.name ?? null,
      expiresAt: invitation.expiresAt,
    };
  }

  /** Aceptación: crea la cuenta de admin y marca la invitación. */
  async accept(token: string, password: string): Promise<AdminAccount> {
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      throw new BadRequestException(
        "La contraseña debe tener entre 8 y 128 caracteres",
      );
    }

    const tokenHash = hashToken(token);
    const invitation = await this.invitationRepo.findOne({
      where: { tokenHash },
    });
    if (!invitation) {
      throw new NotFoundException("Invitación inválida");
    }
    if (invitation.status !== AdminInvitationStatus.PENDING) {
      throw new BadRequestException("La invitación ya no está disponible");
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = AdminInvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
      throw new BadRequestException("La invitación ha expirado");
    }

    const existing = await this.accountRepo.findOne({
      where: { username: invitation.username },
    });
    if (existing) {
      throw new ConflictException("El nombre de usuario ya está en uso");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const account = this.accountRepo.create({
      username: invitation.username,
      displayName: invitation.displayName,
      passwordHash,
      role: AdminRole.ADMIN,
      isActive: true,
      tokenVersion: 1,
      assignedChurchId: invitation.assignedChurchId,
      // Aplicamos permisos globales pre-asignados (puede estar vacío).
      globalPermissions: invitation.globalPermissions ?? [],
    });
    const saved = await this.accountRepo.save(account);

    // Crear la asignación admin↔iglesia con los permisos del template.
    await this.assignmentRepo.save(
      this.assignmentRepo.create({
        adminAccountId: saved.id,
        churchId: invitation.assignedChurchId,
        permissions:
          invitation.churchPermissions && invitation.churchPermissions.length > 0
            ? invitation.churchPermissions
            : [...ALL_CHURCH_PERMISSIONS],
      }),
    );

    invitation.status = AdminInvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedByAdminAccountId = saved.id;
    await this.invitationRepo.save(invitation);

    return saved;
  }
}
