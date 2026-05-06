import { requireActiveAdminSession } from '@/app/lib/server-admin-session';

import { AdminAnnouncementsPageClient } from './AdminAnnouncementsPageClient';

export default async function AdminAnnouncementsPage() {
  await requireActiveAdminSession();
  return <AdminAnnouncementsPageClient />;
}
