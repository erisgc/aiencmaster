import { requireActiveAdminSession } from '@/app/lib/server-admin-session';
import { EditReportClient } from './EditReportClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditReportPage({ params }: Props) {
  await requireActiveAdminSession();
  const { id } = await params;
  return <EditReportClient id={id} />;
}
