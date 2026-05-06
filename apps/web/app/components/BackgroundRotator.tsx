'use client';

import { useEffect, useState } from 'react';

import {
  getPublicBackgrounds,
  type PublicBackgroundsResponse,
} from '@/app/lib/site';

import styles from './BackgroundRotator.module.css';

export function BackgroundRotator() {
  const [data, setData] = useState<PublicBackgroundsResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getPublicBackgrounds()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {
        // Silencioso: si falla, simplemente no se muestra el fondo rotativo.
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Detectar si es móvil (responsive a resize)
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 720);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Rotación automática
  useEffect(() => {
    if (!data || !data.enabled || data.images.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % data.images.length);
    }, data.intervalSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [data]);

  if (!data || !data.enabled || data.images.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      aria-hidden
      style={{
        ['--fade' as string]: `${data.fadeSeconds}s`,
      }}
    >
      {data.images.map((img, idx) => {
        const url = isMobile && img.mobileImageUrl ? img.mobileImageUrl : img.imageUrl;
        return (
          <div
            key={img.id}
            className={`${styles.layer} ${idx === activeIndex ? styles.active : ''}`}
            style={{ backgroundImage: `url(${url})` }}
          />
        );
      })}
      <div className={styles.tint} />
    </div>
  );
}
