import { validateEnvironment } from './environment.validation';

describe('validateEnvironment', () => {
  it('fails fast when ADMIN_SESSION_SECRET is missing', () => {
    expect(() =>
      validateEnvironment({
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USERNAME: 'postgres',
        DB_PASSWORD: 'postgres',
        DB_NAME: 'aienc',
        PORT: '3001',
        ADMIN_SESSION_TTL_SECONDS: '43200',
        ADMIN_PENDING_SESSION_TTL_SECONDS: '86400',
        ADMIN_TRUSTED_DEVICE_TTL_SECONDS: '2592000',
        ADMIN_ACCESS_REQUEST_TTL_SECONDS: '86400',
        ADMIN_ACCESS_REQUEST_RETRY_COOLDOWN_SECONDS: '3600',
        ADMIN_BOOTSTRAP_ENABLED: 'false',
        ADMIN_ROOT_RECOVERY_ENABLED: 'false',
      }),
    ).toThrow(/ADMIN_SESSION_SECRET/);
  });

  it('fails when WEB_ORIGIN is not a valid absolute URL', () => {
    expect(() =>
      validateEnvironment({
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_USERNAME: 'postgres',
        DB_PASSWORD: 'postgres',
        DB_NAME: 'aienc',
        PORT: '3001',
        WEB_ORIGIN: '/relative-path',
        ADMIN_SESSION_SECRET:
          'this-is-a-very-long-admin-session-secret-for-tests',
        ADMIN_SESSION_TTL_SECONDS: '43200',
        ADMIN_PENDING_SESSION_TTL_SECONDS: '86400',
        ADMIN_TRUSTED_DEVICE_TTL_SECONDS: '2592000',
        ADMIN_ACCESS_REQUEST_TTL_SECONDS: '86400',
        ADMIN_ACCESS_REQUEST_RETRY_COOLDOWN_SECONDS: '3600',
        ADMIN_BOOTSTRAP_ENABLED: 'false',
        ADMIN_ROOT_RECOVERY_ENABLED: 'false',
      }),
    ).toThrow(/WEB_ORIGIN/);
  });
});
