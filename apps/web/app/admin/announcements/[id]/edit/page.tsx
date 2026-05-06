import { requireActiveAdminSession } from '@/app/lib/server-admin-session';

import { EditAnnouncementPageClient } from './EditAnnouncementPageClient';

export default async function EditAnnouncementPage() {
  await requireActiveAdminSession();
  return <EditAnnouncementPageClient />;
}
