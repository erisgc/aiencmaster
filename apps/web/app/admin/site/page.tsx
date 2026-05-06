import { requireRootSecuritySession } from '@/app/lib/server-admin-session';
import { SiteBackgroundsClient } from './SiteBackgroundsClient';

export default async function SiteBackgroundsPage() {
  await requireRootSecuritySession();
  return <SiteBackgroundsClient />;
}
