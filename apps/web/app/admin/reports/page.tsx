import { requireActiveAdminSession } from '@/app/lib/server-admin-session';
import { ReportsListClient } from './ReportsListClient';

export default async function ReportsPage() {
  await requireActiveAdminSession();
  return <ReportsListClient />;
}
