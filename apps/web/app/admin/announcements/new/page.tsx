import { requireActiveAdminSession } from '@/app/lib/server-admin-session';

import { NewAnnouncementPageClient } from './NewAnnouncementPageClient';

export default async function NewAnnouncementPage() {
  await requireActiveAdminSession();
  return <NewAnnouncementPageClient />;
}
