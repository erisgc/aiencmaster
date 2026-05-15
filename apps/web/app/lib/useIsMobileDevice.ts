'use client';

import { useEffect, useState } from 'react';

/**
 * Detección de "phone" (no tablet, no desktop).
 *
 * Combina dos señales para evitar falsos positivos en tablets grandes
 * o laptops con touch:
 *   1. User-agent contiene marcadores típicos de phone (Android Mobile,
 *      iPhone, etc.). Excluye explícitamente iPad/Tablet.
 *   2. Viewport menor a 768px (umbral común de breakpoint phone vs tablet).
 *
 * La función se ejecuta solo en cliente; durante SSR devuelve `false` para
 * no condicionar el render server y evitar mismatches.
 */
export function useIsMobileDevice(): {
  isMobile: boolean;
  ready: boolean;
} {
  const [state, setState] = useState({ isMobile: false, ready: false });

  useEffect(() => {
    function check() {
      if (typeof window === 'undefined') return;
      const ua = window.navigator.userAgent || '';
      const isTablet = /iPad|Tablet|Nexus 7|Nexus 10|SM-T|Kindle|Silk/i.test(ua);
      // Android sin "Mobile" suele ser tablet; iPhone siempre phone.
      const isAndroidPhone = /Android/i.test(ua) && /Mobile/i.test(ua);
      const isIPhone = /iPhone|iPod/i.test(ua);
      const isWindowsPhone = /Windows Phone|IEMobile/i.test(ua);
      const uaPhone =
        !isTablet && (isAndroidPhone || isIPhone || isWindowsPhone);

      const narrowViewport = window.innerWidth < 768;
      setState({
        isMobile: uaPhone || (narrowViewport && !isTablet),
        ready: true,
      });
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return state;
}

/**
 * Para SSR / Route Handlers: detecta phone solo por user-agent.
 * Útil cuando no podemos depender del viewport.
 */
export function isPhoneUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  if (/iPad|Tablet|Nexus 7|Nexus 10|SM-T|Kindle|Silk/i.test(userAgent)) {
    return false;
  }
  if (/Android/i.test(userAgent) && /Mobile/i.test(userAgent)) return true;
  if (/iPhone|iPod/i.test(userAgent)) return true;
  if (/Windows Phone|IEMobile/i.test(userAgent)) return true;
  return false;
}
