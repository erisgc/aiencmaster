'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

import styles from './BackgroundCropper.module.css';

interface Props {
  imageSrc: string;
  /**
   * Callback con dos blobs ya recortados:
   *  - desktop: 16:9 a 1920×1080 (apto para fondo PC)
   *  - mobile: 9:16 a 1080×1920 (apto para fondo móvil vertical)
   */
  onComplete: (desktop: Blob, mobile: Blob) => void;
  onCancel: () => void;
}

type Mode = 'desktop' | 'mobile';

const DESKTOP_WIDTH = 1920;
const DESKTOP_HEIGHT = 1080;
const MOBILE_WIDTH = 1080;
const MOBILE_HEIGHT = 1920;

async function cropToBlob(
  src: string,
  area: Area,
  outW: number,
  outH: number,
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no soportado');
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    outW,
    outH,
  );
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('No se pudo generar imagen')),
      'image/jpeg',
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
    img.crossOrigin = 'anonymous';
  });
}

export function BackgroundCropper({ imageSrc, onComplete, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>('desktop');
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [desktopArea, setDesktopArea] = useState<Area | null>(null);
  const [mobileArea, setMobileArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset cuando cambia el modo (cada modo guarda su propio crop).
  // Sync intencional con un input externo (cambio de tab).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCrop({ x: 0, y: 0 });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoom(1);
  }, [mode]);

  const onCropComplete = useCallback(
    (_: Area, areaPixels: Area) => {
      if (mode === 'desktop') setDesktopArea(areaPixels);
      else setMobileArea(areaPixels);
    },
    [mode],
  );

  const aspect = mode === 'desktop' ? 16 / 9 : 9 / 16;

  async function handleSave() {
    if (!desktopArea) {
      // Si solo recortó desktop, generamos mobile a partir del centro de la imagen.
      return;
    }
    setBusy(true);
    try {
      const desktop = await cropToBlob(
        imageSrc,
        desktopArea,
        DESKTOP_WIDTH,
        DESKTOP_HEIGHT,
      );
      const mobileSource =
        mobileArea ?? deriveMobileFromDesktop(desktopArea);
      const mobile = await cropToBlob(
        imageSrc,
        mobileSource,
        MOBILE_WIDTH,
        MOBILE_HEIGHT,
      );
      onComplete(desktop, mobile);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el recorte. Intenta con otra imagen.');
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <header className={styles.header}>
          <h3>Ajustar imagen para el fondo</h3>
          <p className={styles.subtitle}>
            Define el recorte para PC (16:9) y para móvil (9:16). El primero se
            usa en pantallas grandes y el segundo cuando la pantalla es vertical.
          </p>
        </header>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'desktop' ? styles.tabActive : ''}`}
            onClick={() => setMode('desktop')}
          >
            PC (16:9)
          </button>
          <button
            type="button"
            className={`${styles.tab} ${mode === 'mobile' ? styles.tabActive : ''}`}
            onClick={() => setMode('mobile')}
          >
            Móvil (9:16)
          </button>
        </div>

        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            classes={{
              containerClassName: styles.cropContainer,
            }}
          />
        </div>

        <div className={styles.zoomRow}>
          <span className={styles.zoomLabel}>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomInput}
          />
        </div>

        <p className={styles.tip}>
          {mode === 'desktop'
            ? 'Esta vista se mostrará en pantallas anchas (PC, tablet horizontal).'
            : 'Esta vista se mostrará en celulares en orientación vertical.'}{' '}
          Si no ajustas el móvil, se generará automáticamente desde el recorte de PC.
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={() => void handleSave()}
            disabled={busy || !desktopArea}
          >
            {busy ? 'Generando…' : 'Aceptar y subir'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Si el usuario sólo recortó la versión desktop, derivamos la móvil
 * tomando una franja vertical centrada de la zona seleccionada.
 */
function deriveMobileFromDesktop(area: Area): Area {
  // Mantener la altura, ajustar ancho a 9/16 del alto, centrado.
  const newWidth = (area.height * 9) / 16;
  const newX = area.x + area.width / 2 - newWidth / 2;
  return {
    x: Math.max(area.x, newX),
    y: area.y,
    width: Math.min(area.width, newWidth),
    height: area.height,
  };
}
