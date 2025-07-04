import { Metadata } from 'next';
import AdminMarketplaceClientContent from '@/components/admin/AdminMarketplaceClientContent';

export const metadata: Metadata = {
  title: 'Marktplatz verwalten | Admin Dashboard | DAVR',
  description: 'Verwalten und moderieren Sie Marktplatzangebote auf der DAVR-Plattform.',
};

// This page remains a Server Component but delegates rendering to the Client Component
export default function AdminMarketplacePage() {
  return <AdminMarketplaceClientContent />;
} 