/**
 * Tests críticos de la cadena ROOT → ROOT.
 *
 * Estos tests son seguridad de primer orden:
 *   - Sólo un ROOT puede emitir invitación targetRole=ROOT
 *   - Sólo un ROOT activo al MOMENTO de aceptar puede haber emitido la
 *     invitación que el invitado está aceptando (cierre de la ventana)
 *   - Un ROOT desactivado o degradado anula sus invitaciones pendientes
 *   - La cuenta resultante tiene exactamente el rol pedido (ROOT o ADMIN)
 *
 * Si algún test de este archivo falla en CI, NO se debe publicar la
 * versión: se está rompiendo el invariant de seguridad principal.
 */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AdminAccount } from './admin-account.entity';
import { AdminChurchAssignment } from './admin-church-assignment.entity';
import {
  AdminInvitation,
  AdminInvitationStatus,
} from './admin-invitation.entity';
import { AdminInvitationsService } from './admin-invitations.service';
import { AdminRole } from './enums/admin-role.enum';
import { Church } from '../churches/church.entity';

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function repoMock<T>(): MockRepo<T> {
  return {
    create: jest.fn((v: Partial<T>) => v as T),
    save: jest.fn((v: T) => Promise.resolve(v)),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };
}

describe('AdminInvitationsService — cadena ROOT', () => {
  let service: AdminInvitationsService;
  let invitationRepo: MockRepo<AdminInvitation>;
  let accountRepo: MockRepo<AdminAccount>;
  let churchRepo: MockRepo<Church>;
  let assignmentRepo: MockRepo<AdminChurchAssignment>;

  const ROOT_ACTOR_ID = '00000000-0000-0000-0000-000000000001';
  const ADMIN_ACTOR_ID = '00000000-0000-0000-0000-000000000002';
  const CHURCH_ID = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    invitationRepo = repoMock<AdminInvitation>();
    accountRepo = repoMock<AdminAccount>();
    churchRepo = repoMock<Church>();
    assignmentRepo = repoMock<AdminChurchAssignment>();

    // Por defecto, no hay accounts/iglesias previas.
    accountRepo.findOne!.mockResolvedValue(null);
    invitationRepo.findOne!.mockResolvedValue(null);
    churchRepo.findOne!.mockResolvedValue({
      id: CHURCH_ID,
      name: 'Iglesia Demo',
    } as Church);

    // accept() corre dentro de this.dataSource.transaction(level, cb) usando
    // manager.getRepository(...). Mockeamos el DataSource para que el manager
    // devuelva los mismos repos mock y la transacción ejecute el callback.
    const managerMock = {
      getRepository: (entity: unknown) => {
        if (entity === AdminInvitation) return invitationRepo;
        if (entity === AdminAccount) return accountRepo;
        if (entity === AdminChurchAssignment) return assignmentRepo;
        if (entity === Church) return churchRepo;
        return repoMock();
      },
    };
    const dataSourceMock = {
      transaction: jest.fn((arg1: unknown, arg2?: unknown) => {
        const cb = (typeof arg1 === 'function' ? arg1 : arg2) as (
          m: typeof managerMock,
        ) => unknown;
        return cb(managerMock);
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminInvitationsService,
        { provide: getRepositoryToken(AdminInvitation), useValue: invitationRepo },
        { provide: getRepositoryToken(AdminAccount), useValue: accountRepo },
        { provide: getRepositoryToken(Church), useValue: churchRepo },
        {
          provide: getRepositoryToken(AdminChurchAssignment),
          useValue: assignmentRepo,
        },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();
    service = moduleRef.get(AdminInvitationsService);
  });

  // ── create() ───────────────────────────────────────────────────────

  it('un ADMIN NO puede crear una invitación targetRole=ROOT', async () => {
    await expect(
      service.create({
        username: 'nuevoroot',
        displayName: 'Nuevo Root',
        createdByAdminAccountId: ADMIN_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ADMIN,
        targetRole: AdminRole.ROOT,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(invitationRepo.save).not.toHaveBeenCalled();
  });

  it('un ROOT activo SÍ puede crear una invitación targetRole=ROOT', async () => {
    accountRepo.findOne!.mockImplementation(async ({ where }) => {
      if ((where as { id?: string }).id === ROOT_ACTOR_ID) {
        return {
          id: ROOT_ACTOR_ID,
          role: AdminRole.ROOT,
          isActive: true,
        } as AdminAccount;
      }
      return null;
    });

    const result = await service.create({
      username: 'segundo.root',
      displayName: 'Segundo Root',
      createdByAdminAccountId: ROOT_ACTOR_ID,
      createdByAdminAccountRole: AdminRole.ROOT,
      targetRole: AdminRole.ROOT,
    });

    expect(result.targetRole).toBe(AdminRole.ROOT);
    expect(result.assignedChurchId).toBeNull();
    expect(result.token).toBeTruthy();
    // El save debe haber persistido la invitación con churchPermissions y
    // globalPermissions vacíos — un ROOT no usa listas explícitas.
    const saved = invitationRepo.save!.mock.calls[0][0] as AdminInvitation;
    expect(saved.targetRole).toBe(AdminRole.ROOT);
    expect(saved.churchPermissions).toEqual([]);
    expect(saved.globalPermissions).toEqual([]);
    expect(saved.assignedChurchId).toBeNull();
  });

  it('rechaza ROOT-invitation si el actor declarado ROOT ya no es ROOT activo en BD', async () => {
    accountRepo.findOne!.mockResolvedValue({
      id: ROOT_ACTOR_ID,
      role: AdminRole.ADMIN, // fue degradado a ADMIN entre el JWT y este momento
      isActive: true,
    } as AdminAccount);

    await expect(
      service.create({
        username: 'tercero.root',
        displayName: 'Tercero',
        createdByAdminAccountId: ROOT_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ROOT, // mentira (defensa por capas)
        targetRole: AdminRole.ROOT,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza ROOT-invitation si el actor está desactivado', async () => {
    accountRepo.findOne!.mockResolvedValue({
      id: ROOT_ACTOR_ID,
      role: AdminRole.ROOT,
      isActive: false,
    } as AdminAccount);

    await expect(
      service.create({
        username: 'cuarto.root',
        displayName: 'Cuarto',
        createdByAdminAccountId: ROOT_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ROOT,
        targetRole: AdminRole.ROOT,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza ADMIN-invitation sin iglesia asignada', async () => {
    await expect(
      service.create({
        username: 'admin1',
        displayName: 'Admin Uno',
        createdByAdminAccountId: ROOT_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ROOT,
        targetRole: AdminRole.ADMIN,
        assignedChurchId: undefined,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza si la iglesia asignada no existe', async () => {
    churchRepo.findOne!.mockResolvedValue(null);
    await expect(
      service.create({
        username: 'admin2',
        displayName: 'Admin Dos',
        createdByAdminAccountId: ROOT_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ROOT,
        targetRole: AdminRole.ADMIN,
        assignedChurchId: CHURCH_ID,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza si username ya está en uso por una cuenta existente', async () => {
    accountRepo.findOne!.mockResolvedValue({
      id: 'existing',
      username: 'tomado',
    } as AdminAccount);
    await expect(
      service.create({
        username: 'tomado',
        displayName: 'Display',
        createdByAdminAccountId: ROOT_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ROOT,
        targetRole: AdminRole.ADMIN,
        assignedChurchId: CHURCH_ID,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza si hay una invitación PENDING para el mismo username', async () => {
    accountRepo.findOne!.mockResolvedValue(null);
    invitationRepo.findOne!.mockResolvedValue({
      id: 'pending',
      username: 'duplicado',
      status: AdminInvitationStatus.PENDING,
    } as AdminInvitation);
    await expect(
      service.create({
        username: 'duplicado',
        displayName: 'Display',
        createdByAdminAccountId: ROOT_ACTOR_ID,
        createdByAdminAccountRole: AdminRole.ROOT,
        targetRole: AdminRole.ADMIN,
        assignedChurchId: CHURCH_ID,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('username inválido (espacios, acentos, demasiado corto) rebota', async () => {
    for (const bad of ['ab', 'con espacios', 'acéntos', 'a'.repeat(51)]) {
      await expect(
        service.create({
          username: bad,
          displayName: 'D',
          createdByAdminAccountId: ROOT_ACTOR_ID,
          createdByAdminAccountRole: AdminRole.ROOT,
          targetRole: AdminRole.ADMIN,
          assignedChurchId: CHURCH_ID,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  // ── accept() ──────────────────────────────────────────────────────

  it('al aceptar una invitación ROOT, vuelve a verificar que el creador sigue siendo ROOT activo', async () => {
    // Invitación válida en BD
    invitationRepo.findOne!.mockResolvedValue({
      id: 'inv-1',
      tokenHash: 'whatever',
      username: 'futuroroot',
      displayName: 'Futuro Root',
      targetRole: AdminRole.ROOT,
      assignedChurchId: null,
      churchPermissions: [],
      globalPermissions: [],
      createdByAdminAccountId: ROOT_ACTOR_ID,
      status: AdminInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    } as AdminInvitation);

    // El creador (`ROOT_ACTOR_ID`) fue degradado entre la creación y la
    // aceptación de la invitación.
    accountRepo.findOne!.mockImplementation(async ({ where }) => {
      if ((where as { id?: string }).id === ROOT_ACTOR_ID) {
        return {
          id: ROOT_ACTOR_ID,
          role: AdminRole.ADMIN, // degradado
          isActive: true,
        } as AdminAccount;
      }
      // No existe cuenta con ese username (porque aún no se acepta)
      return null;
    });

    // Tomamos cualquier "token" — el mock no compara realmente el hash.
    // Reescribimos hashToken con un proxy mock no es necesario porque el
    // service hace `findOne({ where: { tokenHash } })` y nuestro mock
    // ignora el filtro.
    await expect(
      service.accept('token-cualquiera', 'unaContrasenaLarga'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    // La invitación debe quedar marcada REVOKED automáticamente.
    const savedInvitations = invitationRepo.save!.mock.calls.map(
      (c) => c[0],
    ) as AdminInvitation[];
    expect(
      savedInvitations.some(
        (inv) => inv.status === AdminInvitationStatus.REVOKED,
      ),
    ).toBe(true);
  });

  it('al aceptar una invitación ROOT con creador aún ROOT activo, crea cuenta con role=ROOT y sin AdminChurchAssignment', async () => {
    invitationRepo.findOne!.mockResolvedValue({
      id: 'inv-2',
      tokenHash: 'whatever',
      username: 'segundoroot',
      displayName: 'Segundo Root',
      targetRole: AdminRole.ROOT,
      assignedChurchId: null,
      churchPermissions: [],
      globalPermissions: [],
      createdByAdminAccountId: ROOT_ACTOR_ID,
      status: AdminInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    } as AdminInvitation);

    accountRepo.findOne!.mockImplementation(async ({ where }) => {
      if ((where as { id?: string }).id === ROOT_ACTOR_ID) {
        return {
          id: ROOT_ACTOR_ID,
          role: AdminRole.ROOT,
          isActive: true,
        } as AdminAccount;
      }
      return null; // username libre
    });

    accountRepo.save!.mockImplementation(async (acc: AdminAccount) => ({
      id: 'new-root-id',
      ...acc,
    }));

    const result = await service.accept('token', 'unaContrasenaLarga');

    expect(result.role).toBe(AdminRole.ROOT);
    // Para ROOT no se crea AdminChurchAssignment.
    expect(assignmentRepo.save).not.toHaveBeenCalled();
    // assignedChurchId queda null en la cuenta.
    const savedAccount = accountRepo.save!.mock.calls[0][0] as AdminAccount;
    expect(savedAccount.role).toBe(AdminRole.ROOT);
    expect(savedAccount.assignedChurchId).toBeNull();
    expect(savedAccount.globalPermissions).toEqual([]);
  });

  it('al aceptar invitación ADMIN, crea cuenta con role=ADMIN + AdminChurchAssignment con permisos', async () => {
    invitationRepo.findOne!.mockResolvedValue({
      id: 'inv-3',
      tokenHash: 'whatever',
      username: 'pastor.luis',
      displayName: 'Pastor Luis',
      targetRole: AdminRole.ADMIN,
      assignedChurchId: CHURCH_ID,
      churchPermissions: ['MANAGE_CHURCH_ANNOUNCEMENTS', 'SUBMIT_REPORTS'],
      globalPermissions: [],
      createdByAdminAccountId: ROOT_ACTOR_ID,
      status: AdminInvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    } as unknown as AdminInvitation);

    accountRepo.findOne!.mockResolvedValue(null);
    accountRepo.save!.mockImplementation(async (acc: AdminAccount) => ({
      id: 'new-admin-id',
      ...acc,
    }));

    const result = await service.accept('token', 'unaContrasenaLarga');

    expect(result.role).toBe(AdminRole.ADMIN);
    expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    const assignment = assignmentRepo.save!.mock.calls[0][0] as AdminChurchAssignment;
    expect(assignment.churchId).toBe(CHURCH_ID);
    expect(assignment.permissions).toEqual([
      'MANAGE_CHURCH_ANNOUNCEMENTS',
      'SUBMIT_REPORTS',
    ]);
  });

  it('rechaza aceptación si la invitación ya fue ACCEPTED, REVOKED o EXPIRED', async () => {
    for (const status of [
      AdminInvitationStatus.ACCEPTED,
      AdminInvitationStatus.REVOKED,
      AdminInvitationStatus.EXPIRED,
    ]) {
      invitationRepo.findOne!.mockResolvedValueOnce({
        id: 'inv',
        tokenHash: 'x',
        username: 'x',
        displayName: 'x',
        targetRole: AdminRole.ADMIN,
        status,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      } as AdminInvitation);

      await expect(
        service.accept('token', 'una-contrasena-larga'),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('rechaza aceptación con contraseña inválida (< 8)', async () => {
    await expect(
      service.accept('token', 'corta'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
