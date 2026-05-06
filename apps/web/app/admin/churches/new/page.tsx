import { requireActiveAdminSession } from '@/app/lib/server-admin-session';

import { NewChurchPageClient } from './NewChurchPageClient';

export default async function NewChurchPage() {
  await requireActiveAdminSession();
  return <NewChurchPageClient />;
}
