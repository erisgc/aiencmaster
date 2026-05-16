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
  try {
    localStorage.setItem(ADMIN_DEVICE_STORAGE_KEY, deviceId);
  } catch {
    // localStorage puede estar bloqueado (modo privado estricto, configuración
    // del navegador). No es crítico — la cookie sobrevive a esto.
  }
  document.cookie = `${ADMIN_DEVICE_COOKIE}=${deviceId}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/**
 * Lee el deviceId persistido en `document.cookie`. Usado como fallback
 * cuando `localStorage` se ha borrado o está bloqueado (modo privado,
 * limpieza del navegador, cambio de perfil dentro del mismo browser).
 *
 * Sin este fallback, cada vez que el usuario perdía el localStorage se
 * generaba un deviceId NUEVO y el backend lo veía como un dispositivo
 * diferente, exigiendo aprobación del ROOT otra vez. Ese era el "bloqueante
 * misterioso" reportado en la versión anterior.
 */
function readDeviceIdCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${ADMIN_DEVICE_COOKIE}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      const value = trimmed.substring(prefix.length).trim();
      if (value.length > 0) return value;
    }
  }
  return null;
}

function readDeviceIdLocalStorage(): string | null {
  try {
    return localStorage.getItem(ADMIN_DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Devuelve el deviceId estable del dispositivo actual. Orden de prioridad:
 *
 *   1. localStorage (rápido, persistente en sesión normal)
 *   2. cookie SameSite=Lax (sobrevive a limpiezas de localStorage y a
 *      cambios de perfil del mismo browser; el backend también la setea
 *      en cada respuesta de auth)
 *   3. nuevo random (sólo si las dos anteriores fallan)
 *
 * Tras leer, escribe en ambos para resincronizar.
 */
export function ensureAdminDeviceId() {
  const fromStorage = readDeviceIdLocalStorage();
  if (fromStorage) {
    persistDeviceId(fromStorage);
    return fromStorage;
  }

  const fromCookie = readDeviceIdCookie();
  if (fromCookie) {
    persistDeviceId(fromCookie);
    return fromCookie;
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
