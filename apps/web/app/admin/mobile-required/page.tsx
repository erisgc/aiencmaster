import { Suspense } from 'react';

import { MobileRequiredClient } from './MobileRequiredClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'AIENC Admin — Descarga la app',
  description:
    'El panel administrativo solo se opera desde la app oficial en dispositivos móviles.',
};

export default function MobileRequiredPage() {
  return (
    <Suspense fallback={null}>
      <MobileRequiredClient />
    </Suspense>
  );
}
