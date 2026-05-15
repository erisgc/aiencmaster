import { requireRootSecuritySession } from '@/app/lib/server-admin-session';
import { PermissionsPageClient } from './PermissionsPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccountPermissionsPage({ params }: Props) {
  await requireRootSecuritySession();
  const { id } = await params;
  return <PermissionsPageClient accountId={id} />;
}
