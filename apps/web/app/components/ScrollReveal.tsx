'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Activa el scroll-reveal global: observa todos los [data-reveal] del DOM y
 * les añade .is-revealed cuando entran al viewport (una sola vez). No envuelve
 * markup: las páginas sólo agregan el atributo data-reveal donde quieran.
 *
 * - Respeta prefers-reduced-motion (no observa; todo queda visible vía CSS).
 * - Re-escanea al cambiar de ruta (App Router) para los elementos nuevos.
 * - Si IntersectionObserver no existe, revela todo de inmediato (fallback).
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)'),
    );

    if (prefersReduced || !('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );

    nodes.forEach((el) => observer.observe(el));

    // Failsafe: si algo queda sin intersectar (p.ej. ya visible al cargar),
    // revelar tras un frame los que ya estén en pantalla.
    const raf = window.requestAnimationFrame(() => {
      nodes.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-revealed');
          observer.unobserve(el);
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
