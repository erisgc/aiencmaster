'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  adminGetReport,
  adminUpdateReport,
  type ReportSummary,
  type CreateReportPayload,
} from '@/app/lib/admin-reports';
import { ReportForm } from '../../ReportForm';
import styles from '../../page.module.css';

interface Props {
  id: string;
}

export function EditReportClient({ id }: Props) {
  const router = useRouter();
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void adminGetReport(id)
      .then((data) => {
        if (mounted) setReport(data);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setLoadError(
          err instanceof Error ? err.message : 'No se pudo cargar el informe.',
        );
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleSubmit(payload: CreateReportPayload) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await adminUpdateReport(id, payload);
      router.push('/admin/reports');
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el informe.',
      );
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <Link href="/admin/reports" className={styles.backLink}>
              ← Volver a informes
            </Link>
            <h1 className={styles.title}>Informe no disponible</h1>
            <p className={styles.subtitle}>{loadError}</p>
          </div>
        </header>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={styles.page}>
        <p>Cargando informe…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/reports" className={styles.backLink}>
            ← Volver a informes
          </Link>
          <h1 className={styles.title}>Editar informe</h1>
          <p className={styles.subtitle}>
            Toda edición queda registrada en el historial de auditoría junto
            con el admin que la realizó.
          </p>
        </div>
      </header>

      <ReportForm
        initial={report}
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/reports')}
      />
    </div>
  );
}
