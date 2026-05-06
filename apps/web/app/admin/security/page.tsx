import { requireRootSecuritySession } from '@/app/lib/server-admin-session';

import { SecurityPageClient } from './SecurityPageClient';

export default async function AdminSecurityPage() {
  await requireRootSecuritySession();
  return <SecurityPageClient />;
}
