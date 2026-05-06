import { redirect } from 'next/navigation';

import { getServerAdminSession } from '@/app/lib/server-admin-session';

export default async function AdminEntryPage() {
  const session = await getServerAdminSession();

  if (session.status === 'ACTIVE') {
    redirect('/admin/announcements');
  }

  if (session.status === 'BOOTSTRAP_REQUIRED' || session.bootstrapAvailable) {
    redirect('/admin/bootstrap');
  }

  if (session.status === 'UNAUTHENTICATED') {
    redirect('/admin/login');
  }

  redirect('/admin/pending');
}
