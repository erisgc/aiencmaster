import { requireActiveAdminSession } from '@/app/lib/server-admin-session';
import { NewReportClient } from './NewReportClient';

export default async function NewReportPage() {
  await requireActiveAdminSession();
  return <NewReportClient />;
}
