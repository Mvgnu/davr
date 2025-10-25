import { requireRole } from '@/lib/auth/permissions';
import ClaimsManagement from '@/components/dashboard/admin/ClaimsManagement';

export default async function AdminClaimsPage() {
  await requireRole('ADMIN');

  return <ClaimsManagement />;
}
