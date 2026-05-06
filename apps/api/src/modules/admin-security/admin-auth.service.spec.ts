import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AdminAccount } from './admin-account.entity';
import { AdminAccessRequest } from './admin-access-request.entity';
import { AdminActionLog } from './admin-action-log.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRateLimitService } from './admin-rate-limit.service';
import { AdminSessionService } from './admin-session.service';
import { AdminDevice } from './admin_device.entity';
import { AdminAccessRequestStatus } from './enums/admin-access-request-status.enum';
import { AdminDeviceScope } from './enums/admin-device-scope.enum';
import { AdminDeviceStatus } from './enums/admin-device-status.enum';
import { AdminRole } from './enums/admin-role.enum';

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
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
    exists: jest.fn(),
    count: jest.fn(),
  } as unknown as MockRepo<T>;
}

describe('AdminAuthService', () => {
  const accountRepo = createRepoMock<AdminAccount>();
  const deviceRepo = createRepoMock<AdminDevice>();
  const accessRequestRepo = createRepoMock<AdminAccessRequest>();
  const auditRepo = createRepoMock<AdminActionLog>();

  const transactionMock = jest.fn<
    ReturnType<TransactionRunner>,
    Parameters<TransactionRunner>
  >();

  const dataSource: Pick<DataSource, 'transaction'> = {
    transaction: transactionMock,
  };

  const sessionService = {
    isBootstrapEnabled: jest.fn(),
    isRootRecoveryEnabled: jest.fn(),
    getRootRecoveryAvailability: jest.fn(),
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    prepareTrustedDevice: jest.fn(),
    writeActiveSessionCookies: jest.fn(),
    issueActiveSession: jest.fn(),
    issuePendingSession: jest.fn(),
    issueRejectedSession: jest.fn(),
    issueRevokedSession: jest.fn(),
    getRequestIp: jest.fn(),
    getRequestUserAgent: jest.fn(),
    serializeAccount: jest.fn(
      (account: Pick<AdminAccount, 'id' | 'username'>) => ({
        id: account.id,
        username: account.username,
      }),
    ),
    serializeDevice: jest.fn(
      (device: Pick<AdminDevice, 'id' | 'deviceId'>) => ({
        id: device.id,
        deviceId: device.deviceId,
      }),
    ),
    isPendingRequestExpired: jest.fn(),
    isRetryBlockedByRevocation: jest.fn(),
    isRetryBlockedByRequest: jest.fn(),
  };

  const auditService = {
    log: jest.fn(),
  };

  const rateLimitService = {
    consume: jest.fn(),
    reset: jest.fn(),
  };

  let service: AdminAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.ADMIN_BOOTSTRAP_SECRET = 'bootstrap-secret';
    process.env.ADMIN_ROOT_RECOVERY_SECRET = 'recovery-secret';

    sessionService.getRequestIp.mockReturnValue('127.0.0.1');
    sessionService.getRequestUserAgent.mockReturnValue('jest-agent');
    sessionService.isPendingRequestExpired.mockReturnValue(false);
    sessionService.isRetryBlockedByRevocation.mockReturnValue(false);
    sessionService.isRetryBlockedByRequest.mockReturnValue(false);

    transactionMock.mockImplementation((_isolation, work) =>
      Promise.resolve(
        work({
          getRepository: (entity: unknown) => {
            if (entity === AdminAccount) return accountRepo;
            if (entity === AdminDevice) return deviceRepo;
            if (entity === AdminAccessRequest) return accessRequestRepo;
            if (entity === AdminActionLog) return auditRepo;
            throw new Error('Unexpected repository');
          },
        }),
      ),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminAuthService,
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
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: AdminSessionService,
          useValue: sessionService,
        },
        {
          provide: AdminRateLimitService,
          useValue: rateLimitService,
        },
        {
          provide: AdminAuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    service = moduleRef.get(AdminAuthService);
  });

  it('bootstraps the root account and root device once inside a transaction', async () => {
    sessionService.isBootstrapEnabled.mockReturnValue(true);
    sessionService.hashPassword.mockResolvedValue('hashed-password');
    sessionService.prepareTrustedDevice.mockResolvedValue('trusted-token');
    accountRepo.exists.mockResolvedValue(false);
    deviceRepo.exists.mockResolvedValue(false);
    accountRepo.save.mockResolvedValue({
      id: 'root-account',
      username: 'root',
      role: AdminRole.ROOT,
      isActive: true,
      tokenVersion: 1,
    });
    deviceRepo.save.mockResolvedValue({
      id: 'root-device-row',
      deviceId: 'device-1',
      adminAccountId: 'root-account',
      roleScope: AdminDeviceScope.ROOT_DEVICE,
      status: AdminDeviceStatus.APPROVED,
    });

    await service.bootstrapRoot(
      {
        secret: 'bootstrap-secret',
        username: 'root',
        password: 'super-secret-password',
        displayName: 'Administrador raíz',
        deviceId: 'device-1',
        deviceName: 'Equipo principal',
        platform: 'Windows',
        browser: 'Chrome',
      },
      {
        headers: {},
      } as never,
      {} as never,
    );

    expect(transactionMock).toHaveBeenCalled();
    expect(accountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'root',
        role: AdminRole.ROOT,
      }),
    );
    expect(deviceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        adminAccountId: 'root-account',
        roleScope: AdminDeviceScope.ROOT_DEVICE,
        status: AdminDeviceStatus.APPROVED,
      }),
    );
    expect(sessionService.prepareTrustedDevice).toHaveBeenCalled();
    expect(sessionService.writeActiveSessionCookies).toHaveBeenCalled();
  });

  it('refuses to bootstrap a second root through the normal flow', async () => {
    sessionService.isBootstrapEnabled.mockReturnValue(true);
    accountRepo.exists.mockResolvedValue(true);
    deviceRepo.exists.mockResolvedValue(false);

    await expect(
      service.bootstrapRoot(
        {
          secret: 'bootstrap-secret',
          username: 'root',
          password: 'super-secret-password',
          displayName: 'Administrador raíz',
          deviceId: 'device-1',
          deviceName: 'Equipo principal',
          platform: 'Windows',
          browser: 'Chrome',
        },
        {
          headers: {},
        } as never,
        {} as never,
      ),
    ).rejects.toThrow('Root admin or root device already exists');

    expect(transactionMock).toHaveBeenCalled();
    expect(accountRepo.save).not.toHaveBeenCalled();
    expect(deviceRepo.save).not.toHaveBeenCalled();
  });

  it('issues an active session when an approved device logs in', async () => {
    const account = {
      id: 'admin-1',
      username: 'admin',
      passwordHash: 'hash',
      displayName: 'Admin',
      role: AdminRole.ADMIN,
      isActive: true,
      tokenVersion: 1,
    };

    const device = {
      id: 'device-row',
      deviceId: 'device-1',
      adminAccountId: 'admin-1',
      status: AdminDeviceStatus.APPROVED,
      deviceName: 'Browser aprobado',
      platform: 'Windows',
      browser: 'Chrome',
    };

    accountRepo.findOne.mockResolvedValue(account);
    sessionService.verifyPassword.mockResolvedValue(true);
    deviceRepo.findOne.mockResolvedValue(device);
    accountRepo.save.mockResolvedValue({
      ...account,
      lastLoginAt: new Date(),
    });

    const result = await service.login(
      {
        username: 'admin',
        password: 'super-secret-password',
        deviceId: 'device-1',
        deviceName: 'Browser aprobado',
        platform: 'Windows',
        browser: 'Chrome',
      },
      {
        headers: {},
      } as never,
      {} as never,
    );

    expect(result.status).toBe('ACTIVE');
    expect(sessionService.issueActiveSession).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'LOGIN_SUCCEEDED' }),
    );
  });

  it('creates a pending access request for a new device', async () => {
    const account = {
      id: 'admin-1',
      username: 'admin',
      passwordHash: 'hash',
      displayName: 'Admin',
      role: AdminRole.ADMIN,
      isActive: true,
      tokenVersion: 1,
    };

    accountRepo.findOne.mockResolvedValue(account);
    sessionService.verifyPassword.mockResolvedValue(true);
    deviceRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    deviceRepo.save.mockResolvedValue({
      id: 'device-row',
      adminAccountId: 'admin-1',
      deviceId: 'device-2',
      deviceName: 'Equipo nuevo',
      platform: 'macOS',
      browser: 'Safari',
      status: AdminDeviceStatus.PENDING,
    });
    accessRequestRepo.findOne.mockResolvedValue(null);
    accessRequestRepo.save.mockResolvedValue({
      id: 'request-1',
      deviceId: 'device-2',
      status: AdminAccessRequestStatus.PENDING,
      requestedAt: new Date(),
      resolvedAt: null,
    });

    const result = await service.login(
      {
        username: 'admin',
        password: 'super-secret-password',
        deviceId: 'device-2',
        deviceName: 'Equipo nuevo',
        platform: 'macOS',
        browser: 'Safari',
      },
      {
        headers: {},
      } as never,
      {} as never,
    );

    expect(result.status).toBe('PENDING');
    expect(sessionService.issuePendingSession).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'ACCESS_REQUEST_CREATED' }),
    );
  });

  it('blocks logins that try to reuse a deviceId already linked to another account', async () => {
    accountRepo.findOne.mockResolvedValue({
      id: 'admin-1',
      username: 'admin',
      passwordHash: 'hash',
      displayName: 'Admin',
      role: AdminRole.ADMIN,
      isActive: true,
      tokenVersion: 1,
    });
    sessionService.verifyPassword.mockResolvedValue(true);
    deviceRepo.findOne.mockResolvedValue({
      id: 'device-row',
      deviceId: 'device-conflict',
      adminAccountId: 'another-admin',
      status: AdminDeviceStatus.APPROVED,
      roleScope: AdminDeviceScope.ROOT_DEVICE,
    });

    await expect(
      service.login(
        {
          username: 'admin',
          password: 'super-secret-password',
          deviceId: 'device-conflict',
          deviceName: 'Equipo duplicado',
          platform: 'Windows',
          browser: 'Chrome',
        },
        {
          headers: {},
        } as never,
        {} as never,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('recovers the root device through the break-glass flow', async () => {
    sessionService.isRootRecoveryEnabled.mockReturnValue(true);
    sessionService.verifyPassword.mockResolvedValue(true);
    sessionService.prepareTrustedDevice.mockResolvedValue('trusted-token');

    accountRepo.findOne
      .mockResolvedValueOnce({
        id: 'root-account',
        username: 'root',
        passwordHash: 'hash',
        displayName: 'Root',
        role: AdminRole.ROOT,
        isActive: true,
        tokenVersion: 1,
      })
      .mockResolvedValueOnce({
        id: 'root-account',
        username: 'root',
        passwordHash: 'hash',
        displayName: 'Root',
        role: AdminRole.ROOT,
        isActive: true,
        tokenVersion: 1,
      });

    deviceRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'old-root-device',
      deviceId: 'old-root-device-id',
      adminAccountId: 'root-account',
      roleScope: AdminDeviceScope.ROOT_DEVICE,
      status: AdminDeviceStatus.APPROVED,
    });

    deviceRepo.find.mockResolvedValue([
      {
        id: 'old-root-device',
        deviceId: 'old-root-device-id',
        adminAccountId: 'root-account',
        roleScope: AdminDeviceScope.ROOT_DEVICE,
        status: AdminDeviceStatus.APPROVED,
      },
    ]);

    accountRepo.save.mockResolvedValue({
      id: 'root-account',
      username: 'root',
      role: AdminRole.ROOT,
      isActive: true,
      tokenVersion: 2,
    });

    deviceRepo.save
      .mockResolvedValueOnce({
        id: 'old-root-device',
        deviceId: 'old-root-device-id',
        adminAccountId: 'root-account',
        roleScope: AdminDeviceScope.ROOT_DEVICE,
        status: AdminDeviceStatus.REVOKED,
      })
      .mockResolvedValueOnce({
        id: 'new-root-device',
        deviceId: 'new-root-device-id',
        adminAccountId: 'root-account',
        roleScope: AdminDeviceScope.ROOT_DEVICE,
        status: AdminDeviceStatus.APPROVED,
      })
      .mockResolvedValueOnce({
        id: 'new-root-device',
        deviceId: 'new-root-device-id',
        adminAccountId: 'root-account',
        roleScope: AdminDeviceScope.ROOT_DEVICE,
        status: AdminDeviceStatus.APPROVED,
      });

    accessRequestRepo.createQueryBuilder = jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    }));

    await service.recoverRootDevice(
      {
        secret: 'recovery-secret',
        username: 'root',
        password: 'super-secret-password',
        deviceId: 'new-root-device-id',
        deviceName: 'Nuevo root',
        platform: 'Windows',
        browser: 'Chrome',
      },
      {
        headers: {},
      } as never,
      {} as never,
    );

    expect(transactionMock).toHaveBeenCalled();
    expect(sessionService.writeActiveSessionCookies).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'ROOT_DEVICE_RECOVERED' }),
      auditRepo,
    );
  });
});
