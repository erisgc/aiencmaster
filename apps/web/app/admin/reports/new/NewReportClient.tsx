'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  adminCreateReport,
  type CreateReportPayload,
} from '@/app/lib/admin-reports';
import { ReportForm } from '../ReportForm';
import styles from '../page.module.css';

export function NewReportClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(payload: CreateReportPayload) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await adminCreateReport(payload);
      router.push('/admin/reports');
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo crear el informe.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/admin/reports" className={styles.backLink}>
            ← Volver a informes
          </Link>
          <h1 className={styles.title}>Nuevo informe</h1>
          <p className={styles.subtitle}>
            Registra los datos del informe. La cuenta que lo crea queda
            vinculada para trazabilidad ante la DIAN.
          </p>
        </div>
      </header>

      <ReportForm
        submitting={submitting}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/reports')}
      />
    </div>
  );
}
