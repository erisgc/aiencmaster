'use client';

import { useActiveChurch } from './ActiveChurchContext';
import styles from './ChurchSelector.module.css';

/**
 * Selector de iglesia activa para administradores que tienen varias
 * iglesias asignadas. Si solo tiene una, se muestra como etiqueta no
 * editable. Si es ROOT, no se renderiza (ROOT opera sobre todas).
 */
export function ChurchSelector() {
  const { activeChurchId, assignments, isRoot, isLoaded, setActiveChurchId } =
    useActiveChurch();

  if (!isLoaded) return null;
  if (isRoot) {
    return (
      <div className={`${styles.wrap} ${styles.rootBadge}`} title="ROOT: acceso global">
        <span className={styles.label}>Acceso</span>
        <span className={styles.value}>Todas las iglesias</span>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={`${styles.wrap} ${styles.empty}`}>
        <span className={styles.label}>Iglesia</span>
        <span className={styles.value}>Sin asignación</span>
      </div>
    );
  }

  if (assignments.length === 1) {
    return (
      <div className={styles.wrap}>
        <span className={styles.label}>Iglesia</span>
        <span className={styles.value}>
          {assignments[0].churchName ?? assignments[0].churchId.slice(0, 8)}
        </span>
      </div>
    );
  }

  return (
    <label className={styles.wrap}>
      <span className={styles.label}>Iglesia activa</span>
      <select
        className={styles.select}
        value={activeChurchId ?? ''}
        onChange={(e) => setActiveChurchId(e.target.value || null)}
      >
        {assignments.map((a) => (
          <option key={a.churchId} value={a.churchId}>
            {a.churchName ?? a.churchId.slice(0, 8)}
          </option>
        ))}
      </select>
    </label>
  );
}
