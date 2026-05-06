import { requireRootSecuritySession } from '@/app/lib/server-admin-session';
import { AccountHistoryClient } from './AccountHistoryClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccountHistoryPage({ params }: Props) {
  await requireRootSecuritySession();
  const { id } = await params;
  return <AccountHistoryClient id={id} />;
}
