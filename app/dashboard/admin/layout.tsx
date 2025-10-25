import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/permissions';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout role={user.role} user={user}>
      {children}
    </DashboardLayout>
  );
}
