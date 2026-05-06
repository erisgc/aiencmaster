'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  adminCreateInvitation,
  adminListInvitations,
  adminRevokeInvitation,
  type AdminInvitationCreated,
  type AdminInvitationSummary,
} from '@/app/lib/admin-invitations';
import { adminGetChurches, type Church } from '@/app/lib/admin-churches';
import { formatDateTimeWithSeconds } from '@/app/lib/formatDate';

import styles from './page.module.css';

export function InvitationsClient() {
  const [invitations, setInvitations] = useState<AdminInvitationSummary[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formChurchId, setFormChurchId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<{
    url: string;
    invitation: AdminInvitationCreated;
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, churchList] = await Promise.all([
        adminListInvitations(),
        adminGetChurches(),
      ]);
      setInvitations(list);
      setChurches(churchList);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el panel de invitaciones.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const username = formUsername.trim();
    const displayName = formDisplayName.trim();
    if (!/^[a-zA-Z0-9_.-]+$/.test(username) || username.length < 3 || username.length > 50) {
      setFormError('Usuario inválido (3–50 caracteres, sin espacios).');
      return;
    }
    if (displayName.length < 2 || displayName.length > 100) {
      setFormError('Nombre visible inválido (2–100 caracteres).');
      return;
    }
    if (!formChurchId) {
      setFormError('Selecciona la iglesia que el admin podrá administrar.');
      return;
    }

    setSubmitting(true);
    try {
      const inv = await adminCreateInvitation({
        username,
        displayName,
        assignedChurchId: formChurchId,
      });
      const url = `${window.location.origin}/admin/invite/${encodeURIComponent(inv.token)}`;
      setCreatedLink({ url, invitation: inv });
      setFormUsername('');
      setFormDisplayName('');
      setFormChurchId('');
      await refresh();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se pudo crear la invitación.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(id: string) {
    if (
      !window.confirm(
        '¿Revocar esta invitación? El link dejará de funcionar inmediatamente.',
      )
    )
      return;
    try {
      await adminRevokeInvitation(id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo revocar la invitación.',
      );
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore — el link ya está visible en pantalla
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/security" className={styles.backLink}>
            ← Volver a Seguridad
          </Link>
          <h1 className={styles.title}>Invitaciones de administradores</h1>
          <p className={styles.subtitle}>
            Crea un link único para que un nuevo administrador active su cuenta.
            La invitación define el usuario y la iglesia que podrá gestionar.
          </p>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <section className={styles.formCard}>
        <h2 className={styles.sectionTitle}>Nueva invitación</h2>
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Usuario</label>
              <span className={styles.hint}>
                Sólo letras, números, &quot;_&quot;, &quot;.&quot; y &quot;-&quot;. Ejemplo: pastor.juan
              </span>
              <input
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="pastor.juan"
                maxLength={50}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Nombre visible</label>
              <span className={styles.hint}>
                Como aparecerá en el panel y en los informes que genere.
              </span>
              <input
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="Pastor Juan Pérez"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Iglesia asignada</label>
            <span className={styles.hint}>
              El admin sólo podrá generar informes y gestionar datos de la
              iglesia que selecciones aquí.
            </span>
            <select
              value={formChurchId}
              onChange={(e) => setFormChurchId(e.target.value)}
              required
            >
              <option value="">Selecciona una iglesia…</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </option>
              ))}
            </select>
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submitting}
            >
              {submitting ? 'Generando…' : 'Generar link de invitación'}
            </button>
          </div>
        </form>

        {createdLink && (
          <div className={styles.linkBox}>
            <div className={styles.linkBoxHead}>
              <strong>Link generado para @{createdLink.invitation.username}</strong>
              <button
                type="button"
                className={styles.linkClose}
                onClick={() => setCreatedLink(null)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <p className={styles.linkBoxText}>
              Comparte este link con la persona invitada. Es válido por 72
              horas y solo puede usarse una vez. <strong>No volverá a mostrarse</strong>.
            </p>
            <div className={styles.linkRow}>
              <code className={styles.linkCode}>{createdLink.url}</code>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={() => void copyLink(createdLink.url)}
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.listCard}>
        <h2 className={styles.sectionTitle}>Invitaciones existentes</h2>

        {loading ? (
          <p>Cargando…</p>
        ) : invitations.length === 0 ? (
          <p className={styles.empty}>Aún no se ha generado ninguna invitación.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Iglesia</th>
                  <th>Estado</th>
                  <th>Expira</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td>@{inv.username}</td>
                    <td>{inv.displayName}</td>
                    <td>{inv.assignedChurchName ?? '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${inv.status}`]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>{formatDateTimeWithSeconds(inv.expiresAt)}</td>
                    <td className={styles.cellActions}>
                      {inv.status === 'PENDING' && (
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => void handleRevoke(inv.id)}
                        >
                          Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
