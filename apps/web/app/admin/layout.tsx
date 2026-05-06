'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  adminGetSession,
  adminLogout,
  type AdminSessionResponse,
} from '@/app/lib/admin-auth';
import styles from './layout.module.css';

/**
 * Rutas accesibles sin autenticación (login, bootstrap, recovery, pending,
 * y aceptación de invitaciones via /admin/invite/[token]).
 */
function isPublicAdminPath(pathname: string | null) {
  if (!pathname) return false;
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/bootstrap' ||
    pathname === '/admin/pending' ||
    pathname === '/admin/recovery'
  ) {
    return true;
  }
  if (pathname.startsWith('/admin/invite/')) return true;
  return false;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSessionResponse | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublic = isPublicAdminPath(pathname);

  useEffect(() => {
    if (isPublic) return;

    let mounted = true;
    void adminGetSession()
      .then((data) => {
        if (mounted) setSession(data);
      })
      .catch(() => {
        if (mounted) setSession(null);
      });

    return () => {
      mounted = false;
    };
  }, [isPublic, pathname]);

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await adminLogout();
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  const canSeeSecurity = useMemo(() => {
    return (
      session?.status === 'ACTIVE' &&
      session.account?.role === 'ROOT' &&
      session.device?.roleScope === 'ROOT_DEVICE'
    );
  }, [session]);

  if (isPublic) {
    return <main className={styles.publicMain}>{children}</main>;
  }

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className={styles.root}>
      {/* Topbar móvil */}
      <header className={styles.mobileTop}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <span className={styles.mobileTitle}>Panel admin</span>
      </header>

      {mobileOpen && (
        <button
          className={styles.backdrop}
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sidebarTop}>
          <div className={styles.sidebarHeader}>
            <h3>Panel admin</h3>
            <button
              type="button"
              className={styles.sidebarClose}
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
            >
              ×
            </button>
          </div>

          {session?.account && (
            <div className={styles.sessionBox}>
              <strong>{session.account.displayName}</strong>
              <span>@{session.account.username}</span>
              <span className={styles.roleBadge}>{session.account.role}</span>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          <Link
            href="/admin/announcements"
            className={isActive('/admin/announcements') ? styles.navActive : ''}
          >
            Anuncios
          </Link>
          <Link
            href="/admin/churches"
            className={isActive('/admin/churches') ? styles.navActive : ''}
          >
            Iglesias
          </Link>
          <Link
            href="/admin/reports"
            className={isActive('/admin/reports') ? styles.navActive : ''}
          >
            Informes
          </Link>
          <Link
            href="/admin/me"
            className={isActive('/admin/me') ? styles.navActive : ''}
          >
            Mi perfil
          </Link>
          {canSeeSecurity && (
            <Link
              href="/admin/security"
              className={isActive('/admin/security') ? styles.navActive : ''}
            >
              Seguridad
            </Link>
          )}
        </nav>

        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
