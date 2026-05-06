'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { BackgroundCropper } from '@/app/components/BackgroundCropper';
import {
  adminCreateBackground,
  adminDeleteBackground,
  adminGetSiteSettings,
  adminListBackgrounds,
  adminReorderBackgrounds,
  adminUpdateBackground,
  adminUpdateSiteSettings,
  type AdminBackground,
  type SiteSettings,
} from '@/app/lib/site';

import styles from './page.module.css';

export function SiteBackgroundsClient() {
  const [backgrounds, setBackgrounds] = useState<AdminBackground[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Cropper state
  const [pendingFile, setPendingFile] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [bgs, set] = await Promise.all([
        adminListBackgrounds(),
        adminGetSiteSettings(),
      ]);
      setBackgrounds(bgs);
      setSettings(set);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar la configuración.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast]);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Solo se aceptan imágenes.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingFile({
        src: reader.result as string,
        label: labelDraft.trim(),
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCropComplete(desktop: Blob, mobile: Blob) {
    if (!pendingFile) return;
    try {
      const form = new FormData();
      form.append('desktop', desktop, 'desktop.jpg');
      form.append('mobile', mobile, 'mobile.jpg');
      if (pendingFile.label) form.append('label', pendingFile.label);
      await adminCreateBackground(form);
      setPendingFile(null);
      setLabelDraft('');
      setToast('Imagen agregada correctamente.');
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo subir la imagen.',
      );
    }
  }

  async function handleToggleActive(bg: AdminBackground) {
    try {
      await adminUpdateBackground(bg.id, { isActive: !bg.isActive });
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo actualizar.',
      );
    }
  }

  async function handleDelete(bg: AdminBackground) {
    if (
      !window.confirm(
        `¿Eliminar la imagen "${bg.label || 'sin etiqueta'}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    try {
      await adminDeleteBackground(bg.id);
      setToast('Imagen eliminada.');
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo eliminar.',
      );
    }
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= backgrounds.length) return;
    const ordered = [...backgrounds];
    [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
    setBackgrounds(ordered);
    try {
      await adminReorderBackgrounds(ordered.map((b) => b.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo reordenar.',
      );
      await refresh();
    }
  }

  async function handleSettingsChange(next: Partial<SiteSettings>) {
    try {
      const updated = await adminUpdateSiteSettings(next);
      setSettings(updated);
      setToast('Configuración guardada.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar.',
      );
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/security" className={styles.backLink}>
            ← Volver a Seguridad
          </Link>
          <h1 className={styles.title}>Fondos del portal público</h1>
          <p className={styles.subtitle}>
            Sube imágenes que rotarán como fondo en toda la vista pública.
            Define el intervalo de transición y reordena las imágenes según
            quieras que se muestren.
          </p>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button
            type="button"
            className={styles.errorClose}
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Configuración de rotación */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Configuración de rotación</h2>

        <div className={styles.settingsGrid}>
          <label className={styles.settingItem}>
            <span className={styles.settingLabel}>Intervalo (segundos)</span>
            <span className={styles.settingHint}>
              Cuánto tiempo se muestra cada imagen antes de pasar a la siguiente.
            </span>
            <input
              type="number"
              min="2"
              max="120"
              value={settings?.backgroundIntervalSeconds ?? 8}
              onChange={(e) =>
                void handleSettingsChange({
                  backgroundIntervalSeconds: Number(e.target.value) || 8,
                })
              }
            />
          </label>

          <label className={styles.settingItem}>
            <span className={styles.settingLabel}>Duración del fade (segundos)</span>
            <span className={styles.settingHint}>
              Tiempo de la transición suave entre una imagen y la siguiente.
            </span>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={settings?.backgroundFadeSeconds ?? 1}
              onChange={(e) =>
                void handleSettingsChange({
                  backgroundFadeSeconds: Number(e.target.value),
                })
              }
            />
          </label>

          <label className={styles.toggleItem}>
            <input
              type="checkbox"
              checked={settings?.backgroundEnabled ?? true}
              onChange={(e) =>
                void handleSettingsChange({
                  backgroundEnabled: e.target.checked,
                })
              }
            />
            <span>
              <strong>Activar fondo rotativo en el portal</strong>
              <small>Si lo desactivas, el portal usa el fondo por defecto.</small>
            </span>
          </label>
        </div>
      </section>

      {/* Subida nueva */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Agregar nueva imagen</h2>
        <div className={styles.uploadRow}>
          <input
            type="text"
            placeholder="Etiqueta opcional (ej. Fachada del templo)"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            maxLength={120}
            className={styles.labelInput}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            id="bg-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="bg-upload" className={styles.uploadBtn}>
            Seleccionar imagen…
          </label>
        </div>
        <p className={styles.uploadHint}>
          Tras seleccionar la imagen podrás recortarla para PC y previsualizar
          cómo se verá en móvil.
        </p>
      </section>

      {/* Lista */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          Imágenes ({backgrounds.length})
        </h2>

        {loading ? (
          <p>Cargando…</p>
        ) : backgrounds.length === 0 ? (
          <p className={styles.empty}>
            Aún no hay imágenes de fondo. Sube la primera arriba.
          </p>
        ) : (
          <ul className={styles.list}>
            {backgrounds.map((bg, index) => (
              <li key={bg.id} className={styles.item}>
                <div
                  className={styles.thumb}
                  style={{ backgroundImage: `url(${bg.imageUrl})` }}
                  aria-hidden
                />
                <div className={styles.itemBody}>
                  <strong className={styles.itemLabel}>
                    {bg.label || 'Sin etiqueta'}
                  </strong>
                  <span className={styles.itemMeta}>
                    Orden: {bg.sortOrder + 1} · {bg.isActive ? 'Activa' : 'Oculta'}
                  </span>
                  {bg.mobileImageUrl && (
                    <span className={styles.mobileFlag}>
                      Tiene versión móvil dedicada
                    </span>
                  )}
                </div>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => void moveItem(index, -1)}
                    disabled={index === 0}
                    aria-label="Subir"
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => void moveItem(index, 1)}
                    disabled={index === backgrounds.length - 1}
                    aria-label="Bajar"
                    title="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => void handleToggleActive(bg)}
                  >
                    {bg.isActive ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => void handleDelete(bg)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingFile && (
        <BackgroundCropper
          imageSrc={pendingFile.src}
          onComplete={(d, m) => void handleCropComplete(d, m)}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </main>
  );
}
