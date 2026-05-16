import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AdminAccount } from './admin-account.entity';
import { AdminAccessRequest } from './admin-access-request.entity';
import { AdminActionLog } from './admin-action-log.entity';
import { AdminAuditService } from './admin-audit.service';
import { AdminChurchAssignment } from './admin-church-assignment.entity';
import { AdminSecurityService } from './admin-security.service';
import { AdminSessionService } from './admin-session.service';
import { AdminDevice } from './admin_device.entity';
import { Church } from '../churches/church.entity';
import { AdminAccessRequestStatus } from './enums/admin-access-request-status.enum';
import { AdminDeviceScope } from './enums/admin-device-scope.enum';
import { AdminDeviceStatus } from './enums/admin-device-status.enum';
import { AdminRole } from './enums/admin-role.enum';

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
};

type TransactionWork = (manager: {
  getRepository: (entity: unknown) => unknown;
}) => Promise<unknown>;

type TransactionRunner = (
  isolation: unknown,
  work: TransactionWork,
) => Promise<unknown>;

function createRepoMock<T>() {
  return {
    create: jest.fn((value: Partial<T>) => value),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as MockRepo<T>;
}

describe('AdminSecurityService', () => {
  const accountRepo = createRepoMock<AdminAccount>();
  const deviceRepo = createRepoMock<AdminDevice>();
  const accessRequestRepo = createRepoMock<AdminAccessRequest>();
  const auditRepo = createRepoMock<AdminActionLog>();
  const assignmentRepo = createRepoMock<AdminChurchAssignment>();
  const churchRepo = createRepoMock<Church>();

  const sessionService = {
    accessRequestTtlSeconds: 86400,
    isPendingRequestExpired: jest.fn(),
    hashPassword: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const transactionMock = jest.fn<
    ReturnType<TransactionRunner>,
    Parameters<TransactionRunner>
  >();

  const dataSource: Pick<DataSource, 'transaction'> = {
    transaction: transactionMock,
  };

  let service: AdminSecurityService;

  beforeEach(async () => {
    jest.clearAllMocks();

    transactionMock.mockImplementation((_isolation, work) =>
      Promise.resolve(
        work({
          getRepository: (entity: unknown) => {
            if (entity === AdminAccessRequest) return accessRequestRepo;
            if (entity === AdminDevice) return deviceRepo;
            if (entity === AdminActionLog) return auditRepo;
            throw new Error('Unexpected repository');
          },
        }),
      ),
    );

    const expireQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    };

    accessRequestRepo.createQueryBuilder.mockReturnValue(expireQueryBuilder);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminSecurityService,
        {
          provide: getRepositoryToken(AdminAccount),
          useValue: accountRepo,
        },
        {
          provide: getRepositoryToken(AdminDevice),
          useValue: deviceRepo,
        },
        {
          provide: getRepositoryToken(AdminAccessRequest),
          useValue: accessRequestRepo,
        },
        {
          provide: getRepositoryToken(AdminActionLog),
          useValue: auditRepo,
        },
        {
          provide: getRepositoryToken(AdminChurchAssignment),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(Church),
          useValue: churchRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: AdminSessionService,
          useValue: sessionService,
        },
        {
          provide: AdminAuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = moduleRef.get(AdminSecurityService);
  });

  it('only approves access requests that are still pending', async () => {
    accessRequestRepo.findOne.mockResolvedValue({
      id: 'request-1',
      adminAccountId: 'admin-1',
      adminAccount: {
        id: 'admin-1',
        role: AdminRole.ADMIN,
      },
      deviceId: 'device-1',
      deviceName: 'Equipo nuevo',
      platform: 'Windows',
      browser: 'Chrome',
      userAgent: 'jest-agent',
      ip: '127.0.0.1',
      status: AdminAccessRequestStatus.REJECTED,
    });

    await expect(
      service.approveAccessRequest(
        'request-1',
        {},
        {
          account: { id: 'root-account' } as AdminAccount,
          device: { id: 'root-device' } as AdminDevice,
          session: {} as never,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('only rejects access requests that are still pending', async () => {
    accessRequestRepo.findOne.mockResolvedValue({
      id: 'request-2',
      adminAccountId: 'admin-1',
      adminAccount: {
        id: 'admin-1',
        role: AdminRole.ADMIN,
      },
      deviceId: 'device-2',
      deviceName: 'Equipo rechazado',
      platform: 'Windows',
      browser: 'Chrome',
      userAgent: 'jest-agent',
      ip: '127.0.0.1',
      status: AdminAccessRequestStatus.APPROVED,
    });

    await expect(
      service.rejectAccessRequest(
        'request-2',
        {},
        {
          account: { id: 'root-account' } as AdminAccount,
          device: { id: 'root-device' } as AdminDevice,
          session: {} as never,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to revoke the root device', async () => {
    deviceRepo.findOne.mockResolvedValue({
      id: 'root-device-row',
      deviceId: 'root-device',
      adminAccountId: 'root-account',
      roleScope: AdminDeviceScope.ROOT_DEVICE,
      status: AdminDeviceStatus.APPROVED,
    });

    await expect(
      service.revokeDevice('root-device-row', {
        account: { id: 'root-account' } as AdminAccount,
        device: { id: 'root-device-row' } as AdminDevice,
        session: {} as never,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revokes an approved device and clears its trusted token', async () => {
    deviceRepo.findOne.mockResolvedValue({
      id: 'device-row',
      deviceId: 'device-1',
      deviceName: 'Equipo secundario',
      adminAccountId: 'admin-1',
      roleScope: AdminDeviceScope.APPROVED_DEVICE,
      status: AdminDeviceStatus.APPROVED,
      trustedTokenHash: 'trusted-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
      adminAccount: {
        id: 'admin-1',
        username: 'admin',
        displayName: 'Admin',
        role: AdminRole.ADMIN,
      },
    });
    deviceRepo.save.mockResolvedValue({
      id: 'device-row',
      deviceId: 'device-1',
      deviceName: 'Equipo secundario',
      adminAccountId: 'admin-1',
      roleScope: AdminDeviceScope.APPROVED_DEVICE,
      status: AdminDeviceStatus.REVOKED,
      trustedTokenHash: null,
      revokedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      adminAccount: {
        id: 'admin-1',
        username: 'admin',
        displayName: 'Admin',
        role: AdminRole.ADMIN,
      },
    });

    const result = await service.revokeDevice('device-row', {
      account: { id: 'root-account' } as AdminAccount,
      device: { id: 'root-device-row' } as AdminDevice,
      session: {} as never,
    });

    expect(result.status).toBe(AdminDeviceStatus.REVOKED);
    expect(deviceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AdminDeviceStatus.REVOKED,
        trustedTokenHash: null,
      }),
    );
  });

  // ── updateAccountRole: cambio de rol entre cuentas existentes ──

  describe('updateAccountRole', () => {
    const ROOT_ACTOR_ID = 'root-actor';
    const TARGET_ID = 'target';

    function setupActor(role: AdminRole = AdminRole.ROOT, isActive = true) {
      const now = new Date();
      accountRepo.findOne.mockImplementation(async ({ where }) => {
        const w = where as { id?: string };
        if (w.id === ROOT_ACTOR_ID) {
          return {
            id: ROOT_ACTOR_ID,
            username: 'root',
            displayName: 'Root',
            role,
            isActive,
            tokenVersion: 1,
            globalPermissions: [],
            createdAt: now,
            updatedAt: now,
            devices: [],
            churchAssignments: [],
          } as unknown as AdminAccount;
        }
        if (w.id === TARGET_ID) {
          return {
            id: TARGET_ID,
            username: 'target',
            displayName: 'Target',
            role: AdminRole.ADMIN,
            isActive: true,
            tokenVersion: 1,
            globalPermissions: ['MANAGE_GLOBAL_ANNOUNCEMENTS'],
            assignedChurchId: 'church-1',
            createdAt: now,
            updatedAt: now,
            devices: [],
            churchAssignments: [],
          } as unknown as AdminAccount;
        }
        return null;
      });
      accountRepo.save.mockImplementation(
        async (acc: AdminAccount) => acc as AdminAccount,
      );
    }

    function rootActorCtx() {
      return {
        account: { id: ROOT_ACTOR_ID, role: AdminRole.ROOT, username: 'root' } as AdminAccount,
        device: { id: 'd' } as AdminDevice,
        session: {} as never,
      };
    }

    it('rechaza si el actor ya no es ROOT activo en BD (defensa en profundidad)', async () => {
      setupActor(AdminRole.ADMIN, true);
      await expect(
        service.updateAccountRole(TARGET_ID, AdminRole.ROOT, rootActorCtx()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rechaza si el actor está desactivado', async () => {
      setupActor(AdminRole.ROOT, false);
      await expect(
        service.updateAccountRole(TARGET_ID, AdminRole.ROOT, rootActorCtx()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rechaza auto-cambio de rol (actor === target)', async () => {
      setupActor(AdminRole.ROOT, true);
      const ctx = rootActorCtx();
      await expect(
        service.updateAccountRole(ROOT_ACTOR_ID, AdminRole.ADMIN, ctx),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza si el nuevo rol es el mismo que el actual', async () => {
      setupActor(AdminRole.ROOT, true);
      // target ya es ADMIN
      await expect(
        service.updateAccountRole(TARGET_ID, AdminRole.ADMIN, rootActorCtx()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('promueve ADMIN → ROOT, limpia campos legacy y bumpa tokenVersion', async () => {
      setupActor(AdminRole.ROOT, true);
      // ROOT count >= 1 ya, no aplica a promoción.

      await service.updateAccountRole(
        TARGET_ID,
        AdminRole.ROOT,
        rootActorCtx(),
      );

      const saved = accountRepo.save.mock.calls[0][0] as AdminAccount;
      expect(saved.role).toBe(AdminRole.ROOT);
      expect(saved.assignedChurchId).toBeNull();
      expect(saved.globalPermissions).toEqual([]);
      expect(saved.tokenVersion).toBe(2); // bump

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'ROLE_PROMOTED_TO_ROOT',
        }),
      );
    });

    it('degrada ROOT → ADMIN cuando hay otro ROOT activo, bumpa tokenVersion', async () => {
      const now = new Date();
      accountRepo.findOne.mockImplementation(async ({ where }) => {
        const w = where as { id?: string };
        if (w.id === ROOT_ACTOR_ID) {
          return {
            id: ROOT_ACTOR_ID,
            username: 'root',
            displayName: 'Root',
            role: AdminRole.ROOT,
            isActive: true,
            tokenVersion: 1,
            globalPermissions: [],
            createdAt: now,
            updatedAt: now,
            devices: [],
            churchAssignments: [],
          } as unknown as AdminAccount;
        }
        if (w.id === TARGET_ID) {
          return {
            id: TARGET_ID,
            username: 'segundo',
            displayName: 'Segundo',
            role: AdminRole.ROOT,
            isActive: true,
            tokenVersion: 1,
            globalPermissions: [],
            createdAt: now,
            updatedAt: now,
            devices: [],
            churchAssignments: [],
          } as unknown as AdminAccount;
        }
        return null;
      });
      accountRepo.count.mockResolvedValue(2); // dos ROOTs activos
      accountRepo.save.mockImplementation(async (a: AdminAccount) => a);

      await service.updateAccountRole(
        TARGET_ID,
        AdminRole.ADMIN,
        rootActorCtx(),
      );

      const saved = accountRepo.save.mock.calls[0][0] as AdminAccount;
      expect(saved.role).toBe(AdminRole.ADMIN);
      expect(saved.tokenVersion).toBe(2);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'ROLE_DEMOTED_TO_ADMIN',
        }),
      );
    });

    it('protege al último ROOT: rechaza degradar cuando count(roots activos) <= 1', async () => {
      accountRepo.findOne.mockImplementation(async ({ where }) => {
        const w = where as { id?: string };
        if (w.id === ROOT_ACTOR_ID) {
          return {
            id: ROOT_ACTOR_ID,
            role: AdminRole.ROOT,
            isActive: true,
            tokenVersion: 1,
          } as AdminAccount;
        }
        if (w.id === TARGET_ID) {
          return {
            id: TARGET_ID,
            username: 'unico',
            role: AdminRole.ROOT,
            isActive: true,
            tokenVersion: 1,
          } as AdminAccount;
        }
        return null;
      });
      accountRepo.count.mockResolvedValue(1); // sólo el target es ROOT activo

      await expect(
        service.updateAccountRole(TARGET_ID, AdminRole.ADMIN, rootActorCtx()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(accountRepo.save).not.toHaveBeenCalled();
    });
  });
});
