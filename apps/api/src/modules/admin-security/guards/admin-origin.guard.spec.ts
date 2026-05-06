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
});
