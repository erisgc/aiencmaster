import { HttpException, HttpStatus } from '@nestjs/common';

import { AdminRateLimitService } from './admin-rate-limit.service';

describe('AdminRateLimitService', () => {
  let service: AdminRateLimitService;

  beforeEach(() => {
    service = new AdminRateLimitService();
  });

  it('blocks repeated attempts for the same identifier inside the window', () => {
    const policy = {
      scope: 'admin-login',
      windowSeconds: 60,
      blockSeconds: 60,
      message: 'blocked',
      dimensions: [
        {
          label: 'ip',
          value: '127.0.0.1',
          maxAttempts: 2,
        },
      ],
    };

    service.consume(policy);
    service.consume(policy);

    try {
      service.consume(policy);
      fail('Expected the policy to throw HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('clears counters when reset is requested', () => {
    const policy = {
      scope: 'admin-login',
      windowSeconds: 60,
      blockSeconds: 60,
      message: 'blocked',
      dimensions: [
        {
          label: 'ip',
          value: '127.0.0.1',
          maxAttempts: 1,
        },
      ],
    };

    service.consume(policy);
    service.reset('admin-login', [{ label: 'ip', value: '127.0.0.1' }]);

    expect(() => service.consume(policy)).not.toThrow();
  });
});
