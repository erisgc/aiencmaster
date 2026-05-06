'use client';

import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

import styles from './AvatarCropper.module.css';

interface Props {
  imageSrc: string;
  onComplete: (blob: Blob) => void;
  onCancel: () => void;
}

const OUTPUT_SIZE = 512;

async function cropToSquareBlob(src: string, area: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas no soportado'));
        return;
      }
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('No se pudo generar')),
        'image/jpeg',
        0.9,
      );
    };
    img.onerror = () => reject(new Error('Error cargando imagen'));
    img.src = src;
  });
}

export function AvatarCropper({ imageSrc, onComplete, onCancel }: Props) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setArea(areaPixels);
  }, []);

  async function handleSave() {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await cropToSquareBlob(imageSrc, area);
      onComplete(blob);
    } catch (err) {
      console.error(err);
      alert('No se pudo procesar la imagen.');
      setBusy(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.dialog}>
        <h3>Recortar foto de perfil</h3>
        <p className={styles.hint}>
          La imagen se recortará a forma circular para todo el sistema.
        </p>

        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className={styles.zoom}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.save}
            onClick={() => void handleSave()}
            disabled={busy || !area}
          >
            {busy ? 'Guardando…' : 'Guardar foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
