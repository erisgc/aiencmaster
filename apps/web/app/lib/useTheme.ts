'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme(
  storageKey: string,
  defaultTheme: Theme = 'light'
) {
  // ✅ Estado inicial calculado UNA sola vez
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;

    const stored = localStorage.getItem(storageKey) as Theme | null;
    return stored ?? defaultTheme;
  });

  // ✅ Effect SOLO sincroniza con el DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
