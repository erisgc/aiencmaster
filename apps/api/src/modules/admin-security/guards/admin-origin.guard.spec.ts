import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { AdminAuditService } from '../admin-audit.service';
import { AdminOriginGuard } from './admin-origin.guard';

function createExecutionContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('AdminOriginGuard', () => {
  let guard: AdminOriginGuard;
  const logMock = jest.fn();
  const auditService = {
    log: logMock,
  } as unknown as AdminAuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEB_ORIGIN = 'http://localhost:3000';
    guard = new AdminOriginGuard(auditService);
  });

  it('allows safe methods without Origin validation', async () => {
    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'GET',
          headers: {},
        }),
      ),
    ).resolves.toBe(true);
  });

  it('allows mutating requests when Origin matches WEB_ORIGIN', async () => {
    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'POST',
          url: '/admin/auth/login',
          ip: '127.0.0.1',
          headers: {
            origin: 'http://localhost:3000',
            'user-agent': 'jest',
          },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects mutating requests with invalid Origin and Referer', async () => {
    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'POST',
          url: '/admin/auth/login',
          ip: '127.0.0.1',
          headers: {
            origin: 'http://evil.example',
            referer: 'http://evil.example/login',
            'user-agent': 'jest',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(logMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'ADMIN_ORIGIN_REJECTED',
      }),
    );
  });

  // ── MOBILE_APP_ORIGIN: la app Flutter envía Origin: aiencadmin://app ──

  it('allows mutating requests when Origin matches MOBILE_APP_ORIGIN', async () => {
    process.env.MOBILE_APP_ORIGIN = 'aiencadmin://app';
    guard = new AdminOriginGuard(auditService);

    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'POST',
          url: '/admin/auth/login',
          ip: '127.0.0.1',
          headers: {
            origin: 'aiencadmin://app',
            'user-agent': 'AIENCAdmin/0.1 (Android; Flutter)',
          },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects mobile origin when MOBILE_APP_ORIGIN is not configured', async () => {
    delete process.env.MOBILE_APP_ORIGIN;
    guard = new AdminOriginGuard(auditService);

    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'POST',
          url: '/admin/auth/login',
          ip: '127.0.0.1',
          headers: {
            origin: 'aiencadmin://app',
            'user-agent': 'AIENCAdmin/0.1',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects mobile-like origin scheme when MOBILE_APP_ORIGIN points elsewhere', async () => {
    process.env.MOBILE_APP_ORIGIN = 'aiencadmin://app';
    guard = new AdminOriginGuard(auditService);

    // Atacante intenta un esquema custom parecido pero distinto.
    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'POST',
          url: '/admin/auth/login',
          ip: '127.0.0.1',
          headers: {
            origin: 'aiencadmin-evil://app',
            'user-agent': 'curl',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(logMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'ADMIN_ORIGIN_REJECTED',
        metadata: expect.objectContaining({
          allowedOrigins: expect.arrayContaining([
            'http://localhost:3000',
            'aiencadmin://app',
          ]),
        }),
      }),
    );
  });

  it('still accepts WEB_ORIGIN even cuando MOBILE_APP_ORIGIN está activo', async () => {
    process.env.MOBILE_APP_ORIGIN = 'aiencadmin://app';
    guard = new AdminOriginGuard(auditService);

    await expect(
      guard.canActivate(
        createExecutionContext({
          method: 'POST',
          url: '/admin/auth/login',
          ip: '127.0.0.1',
          headers: {
            origin: 'http://localhost:3000',
            'user-agent': 'jest',
          },
        }),
      ),
    ).resolves.toBe(true);
  });
});
