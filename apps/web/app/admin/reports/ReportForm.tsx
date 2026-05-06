'use client';

import { useEffect, useMemo, useState } from 'react';

import { adminGetChurches, type Church } from '@/app/lib/admin-churches';
import {
  REPORT_TYPE_LABELS,
  type ReportType,
  type ReportSummary,
  type CreateReportPayload,
} from '@/app/lib/admin-reports';
import {
  adminGetSession,
  type AdminSessionResponse,
} from '@/app/lib/admin-auth';

import styles from './page.module.css';

const REPORT_TYPES: ReportType[] = [
  'OFFERINGS',
  'ATTENDANCE',
  'EXPENSES',
  'EVENT',
  'OTHER',
];

interface Props {
  initial?: ReportSummary | null;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (payload: CreateReportPayload) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Formulario reutilizable para crear o editar un informe.
 * Renderiza campos específicos según `reportType`.
 */
export function ReportForm({
  initial,
  submitting,
  errorMessage,
  onSubmit,
  onCancel,
}: Props) {
  const [session, setSession] = useState<AdminSessionResponse | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);

  const [reportType, setReportType] = useState<ReportType>(
    initial?.reportType ?? 'OFFERINGS',
  );
  const [churchId, setChurchId] = useState<string>(initial?.churchId ?? '');
  const [title, setTitle] = useState<string>(initial?.title ?? '');
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [periodStart, setPeriodStart] = useState<string>(
    initial ? toDateInput(initial.periodStart) : '',
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    initial ? toDateInput(initial.periodEnd) : '',
  );

  // Tipo-específicos
  const initialData = (initial?.data ?? {}) as Record<string, unknown>;
  const [totalCop, setTotalCop] = useState<string>(
    initialData.totalCop != null ? String(initialData.totalCop) : '',
  );
  const [count, setCount] = useState<string>(
    initialData.count != null ? String(initialData.count) : '',
  );
  const [eventName, setEventName] = useState<string>(
    typeof initialData.name === 'string' ? initialData.name : '',
  );
  const [attendees, setAttendees] = useState<string>(
    initialData.attendees != null ? String(initialData.attendees) : '',
  );
  const [eventSummary, setEventSummary] = useState<string>(
    typeof initialData.summary === 'string' ? initialData.summary : '',
  );
  const [freeText, setFreeText] = useState<string>(
    typeof initialData.freeText === 'string' ? initialData.freeText : '',
  );

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void adminGetSession()
      .then(setSession)
      .catch(() => null);
  }, []);

  // Cargar iglesias (solo para ROOT, los admins tienen una asignada).
  useEffect(() => {
    if (session?.account?.role !== 'ROOT') return;
    void adminGetChurches()
      .then(setChurches)
      .catch(() => setChurches([]));
  }, [session]);

  // Preseleccionar la iglesia asignada al admin cuando llegue la sesión.
  // El bail-out garantiza que setState sólo se llame cuando hay un cambio real.
  const preselectChurchId =
    session?.account?.role === 'ADMIN' &&
    session.account &&
    'assignedChurchId' in session.account
      ? (session.account as unknown as { assignedChurchId: string | null })
          .assignedChurchId
      : null;

  useEffect(() => {
    if (preselectChurchId && !churchId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChurchId(preselectChurchId);
    }
  }, [preselectChurchId, churchId]);

  const isRoot = session?.account?.role === 'ROOT';

  const data = useMemo(() => {
    switch (reportType) {
      case 'OFFERINGS':
      case 'EXPENSES':
        return { totalCop: Number(totalCop) };
      case 'ATTENDANCE':
        return { count: Number(count) };
      case 'EVENT':
        return {
          name: eventName,
          attendees: attendees ? Number(attendees) : undefined,
          summary: eventSummary || undefined,
        };
      case 'OTHER':
        return { freeText };
      default:
        return {};
    }
  }, [reportType, totalCop, count, eventName, attendees, eventSummary, freeText]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!churchId) {
      setFormError('Selecciona la iglesia.');
      return;
    }
    if (!title.trim() || title.trim().length > 180) {
      setFormError('El título es obligatorio (máximo 180 caracteres).');
      return;
    }
    if (!periodStart || !periodEnd) {
      setFormError('Indica el período del informe.');
      return;
    }
    if (new Date(periodEnd) < new Date(periodStart)) {
      setFormError('La fecha final no puede ser anterior a la inicial.');
      return;
    }

    if (
      (reportType === 'OFFERINGS' || reportType === 'EXPENSES') &&
      (!Number.isFinite(Number(totalCop)) || Number(totalCop) < 0)
    ) {
      setFormError('Ingresa un monto válido (mayor o igual a 0).');
      return;
    }
    if (reportType === 'ATTENDANCE' && (!Number.isInteger(Number(count)) || Number(count) < 0)) {
      setFormError('Ingresa un número entero de asistentes (>= 0).');
      return;
    }
    if (reportType === 'EVENT' && !eventName.trim()) {
      setFormError('El nombre del evento es obligatorio.');
      return;
    }

    void onSubmit({
      churchId,
      reportType,
      title: title.trim(),
      notes: notes.trim() || undefined,
      periodStart: new Date(periodStart).toISOString(),
      periodEnd: new Date(periodEnd).toISOString(),
      data: data as Record<string, unknown>,
    });
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Tipo de informe</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {REPORT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Iglesia</label>
          {isRoot ? (
            <select
              value={churchId}
              onChange={(e) => setChurchId(e.target.value)}
              required
            >
              <option value="">Selecciona…</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={churchId ? 'Iglesia asignada' : 'Sin iglesia asignada'}
              readOnly
              disabled
            />
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label>Título</label>
        <span className={styles.hint}>
          Identificador descriptivo del informe (ej. &laquo;Ofrendas enero 2026&raquo;).
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={180}
          required
        />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label>Período - inicio</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label>Período - fin</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Datos específicos por tipo */}
      <div className={styles.typeSection}>
        <h3 className={styles.typeTitle}>Datos del informe</h3>

        {(reportType === 'OFFERINGS' || reportType === 'EXPENSES') && (
          <div className={styles.field}>
            <label>
              {reportType === 'OFFERINGS'
                ? 'Total de ofrendas (COP)'
                : 'Total de egresos (COP)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalCop}
              onChange={(e) => setTotalCop(e.target.value)}
              required
            />
          </div>
        )}

        {reportType === 'ATTENDANCE' && (
          <div className={styles.field}>
            <label>Número de asistentes</label>
            <input
              type="number"
              min="0"
              step="1"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
            />
          </div>
        )}

        {reportType === 'EVENT' && (
          <>
            <div className={styles.field}>
              <label>Nombre del evento</label>
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Asistentes (opcional)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Resumen / observaciones</label>
              <textarea
                rows={3}
                value={eventSummary}
                onChange={(e) => setEventSummary(e.target.value)}
                maxLength={2000}
              />
            </div>
          </>
        )}

        {reportType === 'OTHER' && (
          <div className={styles.field}>
            <label>Detalle libre</label>
            <textarea
              rows={5}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={8000}
            />
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label>Notas / observaciones generales (opcional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
        />
      </div>

      {(formError || errorMessage) && (
        <p className={styles.formError}>{formError ?? errorMessage}</p>
      )}

      <div className={styles.formActions}>
        {onCancel && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={submitting}
        >
          {submitting ? 'Guardando…' : 'Guardar informe'}
        </button>
      </div>
    </form>
  );
}

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
