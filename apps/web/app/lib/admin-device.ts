'use client';

const ADMIN_DEVICE_STORAGE_KEY = 'aienc-admin-device-id';
const ADMIN_DEVICE_COOKIE = 'aienc_admin_device_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function randomDeviceId() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function persistDeviceId(deviceId: string) {
  localStorage.setItem(ADMIN_DEVICE_STORAGE_KEY, deviceId);
  document.cookie = `${ADMIN_DEVICE_COOKIE}=${deviceId}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function ensureAdminDeviceId() {
  const existing = localStorage.getItem(ADMIN_DEVICE_STORAGE_KEY);
  if (existing) {
    persistDeviceId(existing);
    return existing;
  }

  const created = randomDeviceId();
  persistDeviceId(created);
  return created;
}

export function getBrowserName() {
  const userAgent = navigator.userAgent;

  if (/edg/i.test(userAgent)) return 'Edge';
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  return 'Unknown';
}

export function getPlatformName() {
  const navigatorWithUAData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };

  return navigatorWithUAData.userAgentData?.platform || navigator.platform || 'Unknown';
}

export function getDefaultAdminDeviceName() {
  return `${getBrowserName()} en ${getPlatformName()}`;
}
