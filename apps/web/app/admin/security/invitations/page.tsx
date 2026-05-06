import { requireRootSecuritySession } from '@/app/lib/server-admin-session';

import { InvitationsClient } from './InvitationsClient';

export default async function InvitationsPage() {
  await requireRootSecuritySession();
  return <InvitationsClient />;
}
