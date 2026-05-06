import styles from './page.module.css';
import { requireActiveAdminSession, serverAdminFetch } from '@/app/lib/server-admin-session';
import type { Church } from '@/app/lib/admin-churches';
import { EditChurchClient } from './EditChurchClient';

export default async function AdminChurchEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireActiveAdminSession();
  const { id } = await params;
  const church = await serverAdminFetch<Church>(`/admin/churches/${id}`);

  return (
    <main className={styles.page}>
      <EditChurchClient initialChurch={church} />
    </main>
  );
}
