import Link from 'next/link';
import styles from './page.module.css';
import { requireActiveAdminSession, serverAdminFetch } from '@/app/lib/server-admin-session';
import type { Church } from '@/app/lib/admin-churches';

export default async function AdminChurchesPage() {
  await requireActiveAdminSession();
  const churches = await serverAdminFetch<Church[]>('/admin/churches');

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Iglesias</h1>
          <p className={styles.subtitle}>
            Administra listado público, estado (activa/inactiva) y datos básicos.
          </p>
        </div>

        <Link className={styles.primaryBtn} href="/admin/churches/new">
          + Nueva iglesia
        </Link>
      </header>

      <section className={styles.list}>
        {churches.map((c) => (
          <div key={c.id} className={styles.row}>
            <div className={styles.left}>
              <div className={styles.nameLine}>
                <span className={styles.name}>{c.name}</span>
                <span className={`${styles.badge} ${c.isActive ? styles.badgeOn : styles.badgeOff}`}>
                  {c.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className={styles.meta}>
                <span>{c.city}</span>
                {c.avgAttendance != null && <span>• Prom: {c.avgAttendance}</span>}
              </div>
            </div>

            <div className={styles.actions}>
              <Link className={styles.btn} href={`/admin/churches/${c.id}`}>
                Gestionar
              </Link>
            </div>
          </div>
        ))}

        {churches.length === 0 && (
          <div className={styles.empty}>
            Aún no hay iglesias. Crea la primera con “Nueva iglesia”.
          </div>
        )}
      </section>
    </main>
  );
}
