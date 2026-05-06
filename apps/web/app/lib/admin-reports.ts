import { API_BASE_URL } from './api';

export type ReportType =
  | 'OFFERINGS'
  | 'ATTENDANCE'
  | 'EXPENSES'
  | 'EVENT'
  | 'OTHER';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  OFFERINGS: 'Ingresos por ofrendas',
  ATTENDANCE: 'Asistencia',
  EXPENSES: 'Egresos',
  EVENT: 'Evento especial',
  OTHER: 'Otro',
};

export interface ReportSummary {
  id: string;
  churchId: string;
  reportType: ReportType;
  title: string;
  notes: string;
  periodStart: string;
  periodEnd: string;
  data: Record<string, unknown>;
  createdByAdminAccountId: string;
  createdByDisplayName: string;
  lastUpdatedByAdminAccountId: string | null;
  lastUpdatedByDisplayName: string | null;
  createdAt: string;
  updatedAt: string;
  church?: {
    id: string;
    name: string;
    city: string;
  };
}

export interface ReportListResponse {
  items: ReportSummary[];
  total: number;
}

export interface CreateReportPayload {
  churchId: string;
  reportType: ReportType;
  title: string;
  notes?: string;
  periodStart: string;
  periodEnd: string;
  data: Record<string, unknown>;
}

export type UpdateReportPayload = Partial<CreateReportPayload>;

export interface ReportsQuery {
  churchId?: string;
  reportType?: ReportType;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

async function reportsRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const body = init?.body;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (typeof window !== 'undefined') {
      const log = res.status >= 500 ? console.error : console.debug;
      log('[admin-reports]', init?.method ?? 'GET', path, res.status, text);
    }
    const friendly =
      res.status === 401
        ? 'Sesión no válida.'
        : res.status === 403
          ? 'No tienes permiso sobre esta iglesia.'
          : res.status === 404
            ? 'Informe no encontrado.'
            : res.status === 400
              ? 'Datos inválidos.'
              : res.status >= 500
                ? 'Error del servidor. Intenta más tarde.'
                : 'No se pudo completar la solicitud.';
    throw new Error(friendly);
  }

  const txt = await res.text();
  if (!txt) return undefined as T;
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error('Respuesta inválida del servidor.');
  }
}

export function adminListReports(query: ReportsQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return reportsRequest<ReportListResponse>(
    `/admin/reports${qs ? `?${qs}` : ''}`,
  );
}

export function adminGetReport(id: string) {
  return reportsRequest<ReportSummary>(`/admin/reports/${id}`);
}

export function adminCreateReport(payload: CreateReportPayload) {
  return reportsRequest<ReportSummary>('/admin/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function adminUpdateReport(id: string, payload: UpdateReportPayload) {
  return reportsRequest<ReportSummary>(`/admin/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function adminDeleteReport(id: string) {
  return reportsRequest<{ deleted: boolean; id: string }>(
    `/admin/reports/${id}`,
    { method: 'DELETE' },
  );
}
