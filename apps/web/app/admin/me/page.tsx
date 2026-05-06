import { requireActiveAdminSession } from '@/app/lib/server-admin-session';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  await requireActiveAdminSession();
  return <ProfileClient />;
}
