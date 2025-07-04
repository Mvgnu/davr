import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { List, AlertTriangle, Package, ArrowRight } from 'lucide-react'; // Updated icons
import { prisma } from '@/lib/db/prisma'; // Import Prisma client

// Type for material data fetched from /api/materials
type MaterialSummary = {
    id: string;
    name: string;
    slug: string;
};

interface MaterialsListPageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

const MaterialsListPage = async ({ searchParams }: MaterialsListPageProps) => {
    let materials: MaterialSummary[] = [];
    let fetchError: string | null = null;

    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
    const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 10; // Default limit
    const skip = (page - 1) * limit;

    try {
        materials = await prisma.material.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: {
                name: 'asc', // Or other desired order
            },
            skip: skip,
            take: limit,
        });
    } catch (error) {
        console.error('[DB Fetch Materials Error]', error);
        fetchError = 'Fehler beim Laden der Materialdaten.'; // German error message
    }

    return (
        <div className="container mx-auto px-4 py-12 text-foreground">
            <h1 
              className="text-3xl md:text-4xl font-bold mb-8 pb-4 border-b border-border/60 animate-fade-in-up opacity-0 [--animation-delay:100ms]"
              style={{ animationFillMode: 'forwards' }}
            >
              Materialübersicht
            </h1>

            {fetchError && (
                <div className="text-center py-16 text-destructive">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="mb-2 text-xl font-semibold">Fehler beim Laden</h2>
                    <p className="text-muted-foreground">{fetchError}</p>
                </div>
            )}

            {!fetchError && materials.length === 0 && (
                 <div 
                    className="text-center py-20 animate-fade-in-up opacity-0"
                    style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
                  >
                    <Package className="mx-auto h-16 w-16 text-muted-foreground/40 mb-5" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Keine Materialien gefunden</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">Es sind derzeit keine Materialien in der Datenbank vorhanden.</p>
                </div>
            )}

            {!fetchError && materials.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {materials.map((material, index) => (
                        <Link 
                            key={material.id} 
                            href={`/materials/${material.slug}`} 
                            className="group block h-full animate-fade-in-up opacity-0"
                            style={{ animationDelay: `${200 + index * 40}ms`, animationFillMode: 'forwards' }}
                        >
                            <div className="p-5 border border-border/80 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out bg-card h-full flex flex-col justify-between hover:border-primary/30">
                                <h2 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-200">{material.name}</h2>
                                <div className="flex justify-end items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    Details 
                                    <ArrowRight className="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MaterialsListPage; 