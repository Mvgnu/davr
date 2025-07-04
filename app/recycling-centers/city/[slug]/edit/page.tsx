import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Metadata } from 'next';
import { getRecyclingCenterBySlug } from '@/lib/data/recycling-centers';
import { RecyclingCenterEditForm } from '@/components/recycling-centers/RecyclingCenterEditForm';
import { BreadcrumbNavigation } from '@/components/BreadcrumbNavigation';
import { query } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Recycling-Center bearbeiten | Aluminium Recycling Deutschland',
  description: 'Bearbeiten Sie die Details eines Recycling-Centers auf unserer Plattform.',
};

export default async function EditRecyclingCenterPage({
  params,
}: {
  params: { city: string; slug: string };
}) {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    return redirect('/login?callbackUrl=/recycling-centers/' + params.city + '/' + params.slug + '/edit');
  }
  
  // Fetch recycling center data
  const recyclingCenter = await getRecyclingCenterBySlug(params.slug);
  
  // If center doesn't exist, return 404
  if (!recyclingCenter) {
    return notFound();
  }
  
  // Check if user is authorized (admin, owner, or has claimed this center)
  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = recyclingCenter.userId === session.user.id;
  const hasClaimed = recyclingCenter.claimedByUserId === session.user.id;
  
  // If not authorized, redirect to detail page
  if (!isAdmin && !isOwner && !hasClaimed) {
    return redirect('/recycling-centers/' + params.city + '/' + params.slug);
  }
  
  // Fetch associated data
  const fetchMaterialOffersQuery = `
    SELECT mo.*, m.name as material_name, m.category as material_category 
    FROM material_offers mo
    JOIN materials m ON mo.material_id = m.id
    WHERE mo.recycling_center_id = $1
  `;
  
  const fetchAcceptedMaterialsQuery = `
    SELECT am.*, m.name as material_name, m.category as material_category 
    FROM accepted_materials am
    JOIN materials m ON am.material_id = m.id
    WHERE am.recycling_center_id = $1
  `;
  
  const [materialOffersResult, acceptedMaterialsResult] = await Promise.all([
    query(fetchMaterialOffersQuery, [recyclingCenter.id]),
    query(fetchAcceptedMaterialsQuery, [recyclingCenter.id]),
  ]);
  
  // Format data for the form
  const formattedData = {
    ...recyclingCenter,
    materialOffers: materialOffersResult.rows.map((row: any) => ({
      id: row.id,
      materialId: row.material_id,
      materialName: row.material_name,
      category: row.material_category,
      price: parseFloat(row.price),
      minQuantity: row.min_quantity ? parseFloat(row.min_quantity) : 0,
      maxQuantity: row.max_quantity ? parseFloat(row.max_quantity) : undefined,
      notes: row.notes,
      active: row.active,
    })),
    acceptedMaterials: acceptedMaterialsResult.rows.map((row: any) => ({
      id: row.id,
      materialId: row.material_id,
      materialName: row.material_name,
      category: row.material_category,
    })),
  };
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <BreadcrumbNavigation 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Recycling-Center', href: '/recycling-centers' },
          { label: params.city, href: `/recycling-centers/${params.city}` },
          { 
            label: recyclingCenter.name, 
            href: `/recycling-centers/${params.city}/${params.slug}` 
          },
          { label: 'Bearbeiten', href: `/recycling-centers/${params.city}/${params.slug}/edit` },
        ]} 
      />
      
      <div className="mt-8">
        <RecyclingCenterEditForm
          centerId={recyclingCenter.id}
          initialData={formattedData}
          onCancel={() => null}
        />
      </div>
    </div>
  );
} 