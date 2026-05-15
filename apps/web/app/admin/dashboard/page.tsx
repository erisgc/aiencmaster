import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'AIENC Admin — Métricas',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
