import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/permissions';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'USER') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout role={user.role} user={user}>
      {children}
    </DashboardLayout>
  );
}
