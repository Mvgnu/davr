import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/permissions';

/**
 * Central dashboard redirect
 * Routes users to their appropriate dashboard based on role
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Redirect to appropriate dashboard based on role
  switch (user.role) {
    case 'USER':
      redirect('/dashboard/user');
    case 'CENTER_OWNER':
      redirect('/dashboard/owner');
    case 'ADMIN':
      redirect('/dashboard/admin');
    default:
      redirect('/dashboard/user');
  }
} 