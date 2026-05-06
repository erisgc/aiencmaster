'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { adminBootstrap, adminGetBootstrapStatus } from '@/app/lib/admin-auth';
import {
  ensureAdminDeviceId,
  getBrowserName,
  getDefaultAdminDeviceName,
  getPlatformName,
} from '@/app/lib/admin-device';
import styles from '../auth.module.css';

export default function AdminBootstrapPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setDeviceName(getDefaultAdminDeviceName());
    });

    void adminGetBootstrapStatus()
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
      await adminBootstrap({
        secret,
        username,
        displayName,
        password,
        deviceId,
        deviceName,
        platform: getPlatformName(),
        browser: getBrowserName(),
      });

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo inicializar el root.');
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.shell}>
      <section className={styles.card}>
        <h1 className={styles.title}>Configuración inicial</h1>
        <p className={styles.subtitle}>
          Esta es la primera vez que se accede al panel de administración.
          Aquí crearás la cuenta principal (root) que tendrá control total
          sobre la plataforma. <strong>Este paso solo se hace una vez.</strong>
        </p>

        {available === false ? (
          <>
            <div className={styles.statusBox}>
              La configuración inicial ya fue completada o no está habilitada.
              Si ya tienes una cuenta, inicia sesión normalmente.
            </div>
            <div className={styles.actions}>
              <Link href="/admin/login" className={styles.secondaryBtn}>
                Ir a iniciar sesión
              </Link>
            </div>
          </>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Clave secreta de configuración</label>
              <span className={styles.hint}>
                Esta clave te la entregó el desarrollador al momento de
                instalar la plataforma. No es una clave que tú inventes;
                es una clave única de seguridad que solo se usa en este paso.
                Si no la tienes, solicítala al equipo técnico.
              </span>
              <input
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                placeholder="Ej: Dcz7y6JGxUXF..."
                autoComplete="off"
              />
            </div>

            <div className={styles.field}>
              <label>Nombre de usuario</label>
              <span className={styles.hint}>
                Elige un nombre corto para iniciar sesión. Solo letras,
                números, guiones y puntos. Ejemplo: pastor.obed
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                maxLength={50}
                placeholder="Ej: admin, pastor.juan"
                autoComplete="username"
              />
            </div>

            <div className={styles.field}>
              <label>Nombre visible</label>
              <span className={styles.hint}>
                Tu nombre real o como quieras que aparezca en el sistema.
                Los demás administradores lo verán.
              </span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={100}
                placeholder="Ej: Pastor Obed Gutiérrez"
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <label>Contraseña</label>
              <span className={styles.hint}>
                Mínimo 8 caracteres. Usa una combinación de letras,
                números y símbolos para mayor seguridad. Memorízala bien.
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div className={styles.field}>
              <label>Nombre de este dispositivo</label>
              <span className={styles.hint}>
                Se detectó automáticamente. Es para identificar desde
                qué computador o celular estás accediendo. Puedes
                cambiarlo si quieres.
              </span>
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                maxLength={100}
                placeholder="Ej: Laptop oficina, Celular personal"
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'Creando cuenta...' : 'Crear cuenta principal'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
