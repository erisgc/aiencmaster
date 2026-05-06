'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  adminGetBootstrapStatus,
  adminGetRootRecoveryStatus,
  adminLogin,
} from '@/app/lib/admin-auth';
import {
  ensureAdminDeviceId,
  getBrowserName,
  getDefaultAdminDeviceName,
  getPlatformName,
} from '@/app/lib/admin-device';
import styles from '../auth.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [rootRecoveryAvailable, setRootRecoveryAvailable] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDeviceName(getDefaultAdminDeviceName());
    });

    void adminGetBootstrapStatus()
      .then((data) => setBootstrapAvailable(data.available))
      .catch(() => setBootstrapAvailable(false));

    void adminGetRootRecoveryStatus()
      .then((data) => setRootRecoveryAvailable(data.available))
      .catch(() => setRootRecoveryAvailable(false));

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Validaciones cliente
    const trimmedUser = username.trim();
    const trimmedDevice = deviceName.trim();
    if (!trimmedUser || trimmedUser.length > 50) {
      setError('El nombre de usuario debe tener entre 1 y 50 caracteres.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('La contraseña debe tener entre 8 y 128 caracteres.');
      return;
    }
    if (!trimmedDevice || trimmedDevice.length > 100) {
      setError('El nombre del dispositivo es obligatorio (máx. 100).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const deviceId = ensureAdminDeviceId();
      const session = await adminLogin({
        username: trimmedUser,
        password,
        deviceId,
        deviceName: trimmedDevice,
        platform: getPlatformName(),
        browser: getBrowserName(),
      });

      if (session.status === 'ACTIVE') {
        router.push('/admin');
      } else {
        router.push('/admin/pending');
      }
      router.refresh();
    } catch (err) {
      // Sólo mostramos errores si son mensajes amigables generados por el cliente.
      // Cualquier respuesta del backend ya viene sanitizada por adminRequest().
      setError(
        err instanceof Error && err.message.length < 200
          ? err.message
          : 'No se pudo iniciar sesión.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>Acceso administrativo</h1>
        <p className={styles.subtitle}>
          El ingreso depende de la cuenta y también del dispositivo autorizado.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Usuario</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className={styles.field}>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Nombre del dispositivo</label>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>

            {bootstrapAvailable && (
              <Link href="/admin/bootstrap" className={styles.secondaryBtn}>
                Bootstrap root
              </Link>
            )}
            {rootRecoveryAvailable && (
              <Link href="/admin/recovery" className={styles.secondaryBtn}>
                Recuperar root
              </Link>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
