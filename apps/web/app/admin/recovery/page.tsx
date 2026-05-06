'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  adminGetRootRecoveryStatus,
  adminRecoverRootDevice,
} from '@/app/lib/admin-auth';
import {
  ensureAdminDeviceId,
  getBrowserName,
  getDefaultAdminDeviceName,
  getPlatformName,
} from '@/app/lib/admin-device';
import styles from '../auth.module.css';

export default function AdminRootRecoveryPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDeviceName(getDefaultAdminDeviceName());
    });

    void adminGetRootRecoveryStatus()
      .then((data) => setAvailable(data.available))
      .catch(() => setAvailable(false));

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const deviceId = ensureAdminDeviceId();
      await adminRecoverRootDevice({
        secret,
        username,
        password,
        deviceId,
        deviceName,
        platform: getPlatformName(),
        browser: getBrowserName(),
      });

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo ejecutar la recuperación del root.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>Recuperación del root</h1>
        <p className={styles.subtitle}>
          Este flujo break-glass sólo debe usarse cuando se perdió el ROOT_DEVICE
          y fue habilitado explícitamente por entorno.
        </p>

        {available === false ? (
          <>
            <div className={styles.statusBox}>
              La recuperación del root no está disponible en este entorno.
            </div>
            <div className={styles.actions}>
              <Link href="/admin/login" className={styles.secondaryBtn}>
                Ir a login
              </Link>
            </div>
          </>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Secreto de recovery</label>
              <input value={secret} onChange={(e) => setSecret(e.target.value)} required />
            </div>

            <div className={styles.field}>
              <label>Usuario root</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div className={styles.field}>
              <label>Contraseña root</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Nombre del nuevo dispositivo root</label>
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'Recuperando…' : 'Transferir ROOT_DEVICE'}
              </button>
              <Link href="/admin/login" className={styles.secondaryBtn}>
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
