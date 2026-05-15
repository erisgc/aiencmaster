'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  adminGetAccountHistory,
  type AccountHistoryResponse,
} from '@/app/lib/admin-auth';
import { formatDateTimeWithSeconds } from '@/app/lib/formatDate';
import {
  actionTypeLabel,
  roleShortLabel,
  targetTypeLabel,
} from '@/app/lib/i18n';

import styles from './page.module.css';

interface Props {
  id: string;
}

/**
 * Si el `targetType` se corresponde con un recurso navegable (reporte,
 * anuncio global, anuncio de iglesia, invitación, iglesia), devuelve la ruta
 * web a la que se puede saltar para verlo o editarlo. Si el recurso fue
 * eliminado se mostrará un mensaje neutro.
 */
function deepLinkFor(
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, unknown> | null,
): { href: string; label: string } | null {
  if (!targetId) return null;
  switch ((targetType ?? '').toUpperCase()) {
    case 'REPORT':
      return { href: `/admin/reports/${targetId}/edit`, label: 'Abrir informe' };
    case 'ANNOUNCEMENT':
      return {
        href: `/admin/announcements/${targetId}/edit`,
        label: 'Abrir anuncio',
      };
    case 'CHURCH_ANNOUNCEMENT': {
      const churchId =
        typeof metadata?.churchId === 'string'
          ? (metadata.churchId as string)
          : null;
      return churchId
        ? {
            href: `/admin/churches/${churchId}#anuncio-${targetId}`,
            label: 'Abrir anuncio de iglesia',
          }
        : null;
    }
    case 'CHURCH':
      return { href: `/admin/churches/${targetId}`, label: 'Abrir iglesia' };
    case 'ADMIN_INVITATION':
      return {
        href: `/admin/security/invitations`,
        label: 'Ver invitaciones',
      };
    case 'ADMIN_ACCOUNT':
      return {
        href: `/admin/security/accounts/${targetId}`,
        label: 'Ver cuenta',
      };
    default:
      return null;
  }
}

export function AccountHistoryClient({ id }: Props) {
  const [data, setData] = useState<AccountHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filterActionType, setFilterActionType] = useState('');
  const [filterText, setFilterText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  const actionTypes = useMemo(
    () =>
      data
        ? Array.from(new Set(data.actions.map((a) => a.actionType))).sort()
        : [],
    [data],
  );

  const filteredActions = useMemo(() => {
    if (!data) return [];
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() + 24 * 3600 * 1000 : null;
    const txt = filterText.trim().toLowerCase();
    return data.actions.filter((a) => {
      if (filterActionType && a.actionType !== filterActionType) return false;
      const ts = new Date(a.createdAt).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (txt) {
        const hay = `${a.actionType} ${a.description ?? ''} ${a.targetType ?? ''}`.toLowerCase();
        if (!hay.includes(txt)) return false;
      }
      return true;
    });
  }, [data, filterActionType, filterText, fromDate, toDate]);

  const hasFilters =
    Boolean(filterActionType) ||
    Boolean(filterText) ||
    Boolean(fromDate) ||
    Boolean(toDate);

  function clearFilters() {
    setFilterActionType('');
    setFilterText('');
    setFromDate('');
    setToDate('');
  }

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
                {roleShortLabel(data.account.role)}
              </span>
              <span
                className={`${styles.tag} ${data.account.isActive ? styles.active : styles.inactive}`}
              >
                {data.account.isActive ? 'Activa' : 'Inactiva'}
              </span>
              {data.account.churchAssignments?.length > 0 ? (
                data.account.churchAssignments.map((a) => (
                  <span key={a.id} className={styles.tag}>
                    {a.churchName ?? a.churchId.slice(0, 8)}
                  </span>
                ))
              ) : data.account.role !== 'ROOT' ? (
                <span className={styles.tag}>Sin iglesias</span>
              ) : null}
            </div>
            <div className={styles.actionsRow}>
              <Link
                href={`/admin/security/accounts/${data.account.id}/permissions`}
                className={styles.permLink}
              >
                Gestionar permisos
              </Link>
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
        <div className={styles.filterGroup}>
          <label htmlFor="action-type-filter">Tipo de acción</label>
          <select
            id="action-type-filter"
            value={filterActionType}
            onChange={(e) => setFilterActionType(e.target.value)}
          >
            <option value="">Todas</option>
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {actionTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="action-text-filter">Buscar en descripción</label>
          <input
            id="action-text-filter"
            type="text"
            placeholder="Ej: reparación, ofrenda…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="from-filter">Desde</label>
          <input
            id="from-filter"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="to-filter">Hasta</label>
          <input
            id="to-filter"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className={styles.clearFiltersBtn}
            onClick={clearFilters}
          >
            Limpiar
          </button>
        )}
      </section>

      <section className={styles.timeline}>
        {filteredActions.length === 0 ? (
          <p className={styles.empty}>
            {hasFilters
              ? 'No hay acciones que coincidan con los filtros.'
              : 'Esta cuenta aún no ha registrado acciones.'}
          </p>
        ) : (
          <ol className={styles.timelineList}>
            {filteredActions.map((action) => {
              const deepLink = deepLinkFor(
                action.targetType,
                action.targetId,
                (action.metadata ?? null) as Record<string, unknown> | null,
              );
              return (
                <li key={action.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} aria-hidden />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHead}>
                      <span className={styles.actionType}>
                        {actionTypeLabel(action.actionType)}
                      </span>
                      <time className={styles.timelineDate}>
                        {formatDateTimeWithSeconds(action.createdAt)}
                      </time>
                    </div>
                    <p className={styles.description}>{action.description}</p>
                    <dl className={styles.metaList}>
                      <div>
                        <dt>Objeto</dt>
                        <dd>
                          {targetTypeLabel(action.targetType)}
                          {action.targetId ? ` · ${action.targetId.slice(0, 8)}…` : ''}
                          {deepLink ? (
                            <>
                              {' '}
                              ·{' '}
                              <Link className={styles.deepLink} href={deepLink.href}>
                                {deepLink.label} ↗
                              </Link>
                            </>
                          ) : action.targetId ? (
                            <span className={styles.deletedHint}>
                              {' '}
                              (recurso ya no disponible o sin vista directa)
                            </span>
                          ) : null}
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
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
