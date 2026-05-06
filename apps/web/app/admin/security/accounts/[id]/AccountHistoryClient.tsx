'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  adminGetAccountHistory,
  type AccountHistoryResponse,
} from '@/app/lib/admin-auth';
import { formatDateTimeWithSeconds } from '@/app/lib/formatDate';

import styles from './page.module.css';

interface Props {
  id: string;
}

export function AccountHistoryClient({ id }: Props) {
  const [data, setData] = useState<AccountHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    let mounted = true;
    void adminGetAccountHistory(id)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : 'No se pudo cargar el historial.',
        );
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (error) {
    return (
      <main className={styles.page}>
        <Link href="/admin/security" className={styles.backLink}>
          ← Volver a Seguridad
        </Link>
        <div className={styles.errorBanner}>{error}</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className={styles.page}>
        <p className={styles.loading}>Cargando historial…</p>
      </main>
    );
  }

  const filteredActions = filterAction
    ? data.actions.filter((a) =>
        a.actionType.toLowerCase().includes(filterAction.toLowerCase()),
      )
    : data.actions;

  // Agrupación de las acciones para visualización
  const actionTypes = Array.from(
    new Set(data.actions.map((a) => a.actionType)),
  ).sort();

  return (
    <main className={styles.page}>
      <Link href="/admin/security" className={styles.backLink}>
        ← Volver a Seguridad
      </Link>

      <header className={styles.header}>
        <div className={styles.accountCard}>
          <div className={styles.accountAvatar}>
            {data.account.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.title}>{data.account.displayName}</h1>
            <p className={styles.username}>@{data.account.username}</p>
            <div className={styles.tags}>
              <span className={`${styles.tag} ${styles[`role_${data.account.role}`]}`}>
                {data.account.role}
              </span>
              <span
                className={`${styles.tag} ${data.account.isActive ? styles.active : styles.inactive}`}
              >
                {data.account.isActive ? 'Activa' : 'Inactiva'}
              </span>
              {data.account.assignedChurchName && (
                <span className={styles.tag}>
                  Iglesia: {data.account.assignedChurchName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{data.actions.length}</span>
            <span className={styles.statLabel}>Acciones registradas</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{actionTypes.length}</span>
            <span className={styles.statLabel}>Tipos distintos</span>
          </div>
        </div>
      </header>

      <section className={styles.filterRow}>
        <label htmlFor="action-filter">Filtrar por tipo de acción</label>
        <input
          id="action-filter"
          type="text"
          placeholder="Ej: REPORT_CREATED, ANNOUNCEMENT_UPDATED…"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        />
      </section>

      <section className={styles.timeline}>
        {filteredActions.length === 0 ? (
          <p className={styles.empty}>
            {filterAction
              ? 'No hay acciones que coincidan.'
              : 'Esta cuenta aún no ha registrado acciones.'}
          </p>
        ) : (
          <ol className={styles.timelineList}>
            {filteredActions.map((action) => (
              <li key={action.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} aria-hidden />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineHead}>
                    <code className={styles.actionType}>{action.actionType}</code>
                    <time className={styles.timelineDate}>
                      {formatDateTimeWithSeconds(action.createdAt)}
                    </time>
                  </div>
                  <p className={styles.description}>{action.description}</p>
                  <dl className={styles.metaList}>
                    <div>
                      <dt>Objeto</dt>
                      <dd>
                        {action.targetType}
                        {action.targetId ? ` · ${action.targetId.slice(0, 8)}…` : ''}
                      </dd>
                    </div>
                    {action.ip && (
                      <div>
                        <dt>IP</dt>
                        <dd>{action.ip}</dd>
                      </div>
                    )}
                    {action.metadata && Object.keys(action.metadata).length > 0 && (
                      <div className={styles.metaFull}>
                        <dt>Metadatos</dt>
                        <dd>
                          <pre>{JSON.stringify(action.metadata, null, 2)}</pre>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
