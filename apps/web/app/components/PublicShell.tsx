'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import styles from './PublicShell.module.css';
import { useTheme } from '@/app/lib/useTheme';
import { useIsClient } from '@/app/lib/useIsClient';
import { BackgroundRotator } from './BackgroundRotator';

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
  icon: React.ReactNode;
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.6 12 3l9 7.6" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13V9a2 2 0 0 1 2-2h2l8-3v14l-8-3H6a2 2 0 0 1-2-2Z" />
      <path d="m9 15 1.5 4.2" />
      <path d="M18 9.5a3.5 3.5 0 0 1 0 4.9" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.2v5.3" />
      <circle cx="12" cy="7.7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.3" />
      <path d="M12 19.2v2.3" />
      <path d="m5.4 5.4 1.6 1.6" />
      <path d="m17 17 1.6 1.6" />
      <path d="M2.5 12h2.3" />
      <path d="M19.2 12h2.3" />
      <path d="m5.4 18.6 1.6-1.6" />
      <path d="M17 7l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M19 13.2A7.6 7.6 0 0 1 10.8 5a8.2 8.2 0 1 0 8.2 8.2Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3 4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/**
 * Items visibles en el sidebar público.
 * NOTA: las rutas /churches y otras siguen funcionando si se acceden
 * directamente, pero no aparecen en la navegación por decisión de
 * producto (lanzamiento mínimo: sólo Inicio, Anuncios e Información).
 */
const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Inicio',
    shortLabel: 'Inicio',
    eyebrow: 'Portal publico',
    description: 'Resumen institucional y anuncios recientes.',
    icon: <HomeIcon />,
  },
  {
    href: '/announcements',
    label: 'Anuncios',
    shortLabel: 'Anuncios',
    eyebrow: 'Actualidad',
    description: 'Listado de anuncios, comunicados y publicaciones.',
    icon: <MegaphoneIcon />,
  },
  {
    href: '/info',
    label: 'Informacion',
    shortLabel: 'Informacion',
    eyebrow: 'Institucional',
    description: 'Datos de contacto y referencias generales.',
    icon: <InfoIcon />,
  },
];


function resolvePageMeta(pathname: string | null | undefined) {
  const current =
    NAV_ITEMS.find((item) => item.href === pathname) ??
    NAV_ITEMS.find(
      (item) => item.href !== '/' && pathname?.startsWith(item.href),
    ) ??
    NAV_ITEMS[0];

  return current;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const { theme, toggleTheme } = useTheme('theme:public', 'light');
  const isClient = useIsClient();

  const isAdmin = useMemo(() => pathname?.startsWith('/admin'), [pathname]);
  if (isAdmin) return <>{children}</>;

  const pageMeta = resolvePageMeta(pathname);
  const closeMobile = () => setOpen(false);

  const shellClassName = `${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`;
  const sidebarClassName = `${styles.sidebar} ${open ? styles.sidebarOpen : ''} ${
    collapsed ? styles.sidebarCollapsed : ''
  }`;

  return (
    <div className={shellClassName}>
      {/* Fondo rotativo gestionado por el ROOT desde /admin/site/background */}
      <BackgroundRotator />

      <aside
        className={sidebarClassName}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
      >
        <div className={styles.sidebarGlow} aria-hidden />

        <button
          type="button"
          className={styles.collapseHamburger}
          aria-label="Expandir menu"
          title="Expandir menu"
          onClick={() => setCollapsed(false)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={styles.brand}>
          <Link href="/" className={styles.logo} onClick={closeMobile}>
            <Image
              src="/Logoaienc.png"
              alt="AIENC"
              width={44}
              height={44}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>

          <div className={styles.brandText}>
            <div className={styles.brandTitle}>AIENC</div>
            <div className={styles.brandSubtitle}>Portal institucional</div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeMobile}
            aria-label="Cerrar menu"
          >
            x
          </button>
        </div>

        <div className={styles.sidebarSummary}>
          <p className={styles.sidebarEyebrow}>Navegacion</p>
          <p className={styles.sidebarDescription}>
            Consulta anuncios oficiales e información institucional de la
            Asociación.
          </p>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                onClick={closeMobile}
              >
                <span className={styles.navIcon} aria-hidden>
                  {item.icon}
                </span>
                <span className={styles.navCopy}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link
            href="/admin"
            className={styles.adminLink}
            onClick={closeMobile}
          >
            <span className={styles.adminIcon} aria-hidden>
              <ShieldIcon />
            </span>
            <span className={styles.adminLabel}>Administración</span>
          </Link>
          <span className={styles.footerHint}>Informacion oficial y actualizada</span>
        </div>
      </aside>

      {open && (
        <button
          className={styles.backdrop}
          aria-label="Cerrar menu"
          onClick={closeMobile}
        />
      )}

      <div className={styles.content}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={styles.topbarInfo}>
            <span className={styles.topbarEyebrow}>{pageMeta.eyebrow}</span>
            <div className={styles.topbarTitle}>{pageMeta.shortLabel}</div>
          </div>

          {isClient && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? 'Activar modo oscuro'
                  : 'Activar modo claro'
              }
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              className={styles.themeBtn}
            >
              <span className={styles.themeIcon} aria-hidden>
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </span>
            </button>
          )}
        </header>

        <div className={styles.page}>{children}</div>
      </div>
    </div>
  );
}
