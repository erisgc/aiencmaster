'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  acceptInvitation,
  previewInvitation,
  type InvitationPreview,
} from '@/app/lib/admin-invitations';
import styles from '../../auth.module.css';

interface Props {
  token: string;
}

export function AcceptInviteClient({ token }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    void previewInvitation(token)
      .then((data) => {
        if (mounted) setPreview(data);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'No se pudo verificar la invitación.',
        );
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 8 || password.length > 128) {
      setError('La contraseña debe tener entre 8 y 128 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await acceptInvitation(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 1800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo aceptar la invitación.',
      );
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className={styles.shell}>
        <section className={styles.card}>
          <h1 className={styles.title}>Invitación no válida</h1>
          <p className={styles.subtitle}>{loadError}</p>
          <div className={styles.actions}>
            <Link href="/" className={styles.secondaryBtn}>
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className={styles.shell}>
        <section className={styles.card}>
          <p className={styles.subtitle}>Verificando invitación…</p>
        </section>
      </div>
    );
  }

  if (!preview.valid) {
    const message =
      preview.status === 'ACCEPTED'
        ? 'Esta invitación ya fue aceptada. Inicia sesión normalmente.'
        : preview.status === 'REVOKED'
          ? 'Esta invitación fue revocada por el administrador.'
          : preview.status === 'EXPIRED'
            ? 'Esta invitación ha expirado. Solicita una nueva al administrador.'
            : 'Esta invitación no está disponible.';
    return (
      <div className={styles.shell}>
        <section className={styles.card}>
          <h1 className={styles.title}>Invitación no disponible</h1>
          <p className={styles.subtitle}>{message}</p>
          <div className={styles.actions}>
            <Link href="/admin/login" className={styles.secondaryBtn}>
              Ir a iniciar sesión
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.shell}>
        <section className={styles.card}>
          <h1 className={styles.title}>¡Cuenta creada!</h1>
          <p className={styles.subtitle}>
            Tu cuenta ha sido activada correctamente. Te redirigimos al inicio
            de sesión...
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>Activar cuenta de administrador</h1>
        <p className={styles.subtitle}>
          Has sido invitado/a a administrar la iglesia{' '}
          <strong>{preview.churchName ?? 'asignada'}</strong>. Define una
          contraseña para activar tu cuenta.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Usuario</label>
            <span className={styles.hint}>
              Tu usuario fue definido por el administrador. Es el que usarás
              para iniciar sesión.
            </span>
            <input value={preview.username ?? ''} readOnly disabled />
          </div>

          <div className={styles.field}>
            <label>Nombre visible</label>
            <span className={styles.hint}>
              Como apareces en el sistema. Lo verán otros administradores.
            </span>
            <input value={preview.displayName ?? ''} readOnly disabled />
          </div>

          <div className={styles.field}>
            <label>Iglesia asignada</label>
            <span className={styles.hint}>
              Solo podrás generar informes y gestionar contenido de esta
              iglesia.
            </span>
            <input value={preview.churchName ?? ''} readOnly disabled />
          </div>

          <div className={styles.field}>
            <label>Nueva contraseña</label>
            <span className={styles.hint}>
              Mínimo 8 caracteres. Combina letras, números y símbolos.
              Memorízala bien — no se puede recuperar sin el administrador.
            </span>
            <input
              type="password"
              value={password}
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Confirmar contraseña</label>
            <span className={styles.hint}>Escribe la misma contraseña.</span>
            <input
              type="password"
              value={confirm}
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submitting}
            >
              {submitting ? 'Activando...' : 'Activar cuenta'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
