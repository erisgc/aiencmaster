'use client';

import { useSyncExternalStore } from 'react';

function subscribe() {
  // No hay eventos reales a escuchar; devolvemos un unsubscribe vacío.
  return () => {};
}

function getServerSnapshot() {
  return false;
}

function getSnapshot() {
  return true;
}

export function useIsClient() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
