import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Users, ArrowRight, ArrowUp, ArrowDown, Package, Building, Store, AlertTriangle, Recycle, Truck, Factory, ShoppingBag, Leaf, Award, Scissors, Droplet } from 'lucide-react'; // Updated icons
import { Badge } from '@/components/ui/badge'; // Added Badge
import Image from 'next/image'; // Import Image component
import MaterialJourney, { JourneyStep, DetailedJourneyStep } from '@/components/materials/MaterialJourney';
import { Prisma } from '@prisma/client'; // Import Prisma type
import { prisma } from '@/lib/db/prisma'; // Ensure Prisma Client instance is imported

// Define the expected shape of the material data from the API
type MaterialDetail = {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    parent_id: string | null;
    image_url: string | null;
    journeyStepsJson?: Prisma.JsonValue | null;
    parent?: { name: string; slug: string } | null;
    children?: { name: string; slug: string }[];
};

type JourneyStepData = Omit<JourneyStep, 'icon'> & { iconName: string };

// Map icon names (from JSON) to actual Lucide components
const iconMap: { [key: string]: React.ReactNode } = {
  ShoppingBag: <ShoppingBag size={20} />,
  Truck: <Truck size={20} />,
  Factory: <Factory size={20} />,
  Recycle: <Recycle size={20} />,
  Scissors: <Scissors size={20} />,
  Droplet: <Droplet size={20} />,
  // Add other icons as needed
};

interface MaterialPageParams {
    params: { slug: string };
}

// Fetch function specific to this page - MODIFIED to fetch from DB directly
async function getMaterialDetails(slug: string): Promise<MaterialDetail | null> {
    try {
        // Fetch directly using Prisma
        const material = await prisma.material.findUnique({
            where: { slug: slug },
            select: {
                id: true,
                name: true,
                description: true,
                slug: true,
                parent_id: true,
                image_url: true,
                // @ts-ignore - Prisma's generated types might not perfectly handle JSON field selection here
                journeyStepsJson: true,
                parent: {
                    select: { name: true, slug: true } 
                },
                children: {
                    select: { name: true, slug: true }
                }
            }
        });

        if (!material) {
            return null;
        }
        
        // Add type assertion to match our expected MaterialDetail type
        return material as unknown as MaterialDetail;

    } catch (error) {
        console.error('[getMaterialDetails Prisma Error]', error);
        return null; 
    }
}

// Helper function to generate/process journey steps
const processJourneySteps = (materialName: string, journeyJson?: Prisma.JsonValue | null): JourneyStep[] | DetailedJourneyStep[] => {
  // Default steps (German)
  const defaultSteps: JourneyStep[] = [
    { id: 1, title: "Sammlung", description: `${materialName} wird üblicherweise gesammelt.`, icon: <ShoppingBag size={20} />, impact: "Abfallvermeidung" },
    { id: 2, title: "Transport", description: "Transport zu Sortier- oder Verarbeitungsanlagen.", icon: <Truck size={20} /> },
    { id: 3, title: "Aufbereitung", description: `${materialName} wird sortiert und für das Recycling vorbereitet.`, icon: <Factory size={20} />, energySaved: "Energieeinsparung" },
    { id: 4, title: "Neues Produkt", description: `Recyceltes ${materialName.toLowerCase()} wird zu neuen Produkten verarbeitet.`, icon: <Recycle size={20} />, impact: "Ressourcenschonung" }
  ];
  
  if (!journeyJson || typeof journeyJson !== 'object') {
      console.warn(`No valid journey steps found for ${materialName}, using default.`);
      return defaultSteps;
  }

  try {
    // We need to handle the JSON data safely
    const journeyArray = Array.isArray(journeyJson) ? journeyJson : [];
    
    if (journeyArray.length === 0) {
      return defaultSteps;
    }
    
    // Check the first item to determine format
    const firstItem = journeyArray[0];
    
    // Using 'as any' to bypass TypeScript's strict type checking for JSON objects
    if (firstItem && typeof firstItem === 'object' && 'image_url' in firstItem) {
      // These are DetailedJourneyStep objects
      return journeyArray as unknown as DetailedJourneyStep[];
    } else if (firstItem && typeof firstItem === 'object' && 'iconName' in firstItem) {
      // These are the old format with iconName
      return journeyArray.map((stepData: any, index) => ({
        id: stepData.id || index + 1,
        title: stepData.title || `Schritt ${index + 1}`,
        description: stepData.description || '',
        icon: iconMap[stepData.iconName] || <Package size={20} />,
        impact: stepData.impact,
        energySaved: stepData.energySaved,
        co2Reduced: stepData.co2Reduced
      }));
    } else {
      // Unknown format, use defaults
      console.warn(`Unknown journey step format for ${materialName}, using default.`);
      return defaultSteps;
    }
  } catch (e) {
      console.error("Error parsing journey steps JSON:", e);
      return defaultSteps; // Fallback to default on error
  }
};

const MaterialDetailPage = async ({ params }: MaterialPageParams) => {
    const { slug } = params;
    let material: MaterialDetail | null = null;
    let fetchError: string | null = null;

    try {
        material = await getMaterialDetails(slug);
    } catch (error) {
        // This catch is less likely now with direct DB fetch, but keep for safety
        fetchError = error instanceof Error ? error.message : 'An unknown error occurred while fetching material details.';
    }

    if (!material && !fetchError) {
        notFound();
    }

    // Enhanced Error State
    if (fetchError) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-semibold text-destructive mb-2">Fehler beim Laden</h1>
                <p className="text-muted-foreground mb-6">{fetchError}</p>
                <Button asChild variant="outline" size="sm">
                    <Link href="/materials">
                        <ArrowLeft className="mr-2 h-4 w-4"/> Zurück zur Materialübersicht
                    </Link>
                </Button>
            </div>
        );
    }

    // Render page if material is found
    if (material) {
        // Process journey steps from JSON or use defaults
        const journeySteps = processJourneySteps(material.name, material.journeyStepsJson);
        const materialType = material.parent ? material.parent.name : "Wertstoff"; // Use German default
        const placeholderImage = '/images/placeholder/material.jpg'; // Define placeholder
        
        return (
            // Enhanced Container & Header Section
            <div className="container mx-auto px-4 py-12 text-foreground">
                {/* Breadcrumbs / Back Link - Enhanced */}
                <div className="mb-8 text-sm text-muted-foreground flex items-center space-x-2">
                    <Link href="/materials" className="hover:text-foreground transition-colors">Materialien</Link>
                    <span>/</span>
                    {material.parent && (
                        <>
                            <Link href={`/materials/${material.parent.slug}`} className="hover:text-foreground transition-colors">{material.parent.name}</Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="font-medium text-foreground">{material.name}</span>
                </div>

                {/* Main Content Area */}
                <div className="bg-card text-card-foreground shadow-lg rounded-lg border border-border/60 overflow-hidden">
                   <div className="relative w-full h-48 md:h-64 bg-muted overflow-hidden">
                     <Image
                       src={material.image_url || placeholderImage}
                       alt={material.name || 'Material'}
                       fill
                       className="object-cover"
                       sizes="100vw"
                       priority // Prioritize image as it's likely important content
                     />
                     {/* Optional: Add overlay if needed */}
                     {/* <div className="absolute inset-0 bg-black/20"></div> */}
                   </div>
                   <div className="p-6 md:p-8">
                     {/* Animated Title */}
                     <h1 
                       className="text-3xl md:text-4xl font-bold mb-4 text-foreground animate-fade-in-up opacity-0 [--animation-delay:100ms]"
                       style={{ animationFillMode: 'forwards' }}
                     >
                       {material.name}
                     </h1>
                     {/* Enhanced Description */}
                     {material.description && (
                        <div 
                           className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none text-foreground/90 mb-8 animate-fade-in-up opacity-0 [--animation-delay:200ms]"
                           style={{ animationFillMode: 'forwards' }}
                        >
                            {material.description}
                        </div>
                     )}

                     {/* Material Journey Section */}
                     <div 
                       className="mt-10 animate-fade-in-up opacity-0 [--animation-delay:350ms]"
                       style={{ animationFillMode: 'forwards' }}
                     >
                       {journeySteps.length > 0 ? (
                           <MaterialJourney
                             materialName={material.name}
                             materialType={materialType}
                             journeySteps={journeySteps} // Pass processed steps
                             className="mb-8"
                           />
                       ) : (
                           <p className="text-muted-foreground text-center py-4">Keine Reiseinformationen verfügbar.</p> // Fallback message
                       )}
                     </div>

                     {/* Hierarchy Info - Enhanced */}
                     {(material.parent || (Array.isArray(material.children) && material.children.length > 0)) && (
                        <div 
                           className="mb-8 p-5 border border-border/80 rounded-lg bg-muted/50 animate-fade-in-up opacity-0 [--animation-delay:300ms]"
                           style={{ animationFillMode: 'forwards' }}
                        >
                           <h3 className="font-semibold text-lg mb-3 text-foreground">Materialhierarchie</h3>
                           
                           {/* Parent Material */}
                           {material.parent && (
                              <div className="mb-3">
                                 <p className="text-sm text-muted-foreground mb-1">Übergeordnete Kategorie:</p>
                                 <Link 
                                    href={`/materials/${material.parent.slug}`} 
                                    className="inline-flex items-center text-primary hover:underline"
                                 >
                                    <ArrowUp className="mr-1 h-4 w-4" />
                                    {material.parent.name}
                                 </Link>
                              </div>
                           )}
                           
                           {/* Child Materials */}
                           {Array.isArray(material.children) && material.children.length > 0 && (
                              <div>
                                 <p className="text-sm text-muted-foreground mb-1">Untergeordnete Materialien:</p>
                                 <div className="flex flex-wrap gap-2">
                                    {material.children.map((child) => (
                                       <Link 
                                          key={child.slug} 
                                          href={`/materials/${child.slug}`}
                                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors"
                                       >
                                          <ArrowDown className="mr-1 h-3.5 w-3.5" />
                                          {child.name}
                                       </Link>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {/* Related Links Section - Enhanced */}
                     <div 
                       className="mt-8 pt-6 border-t border-border/60 animate-fade-in-up opacity-0 [--animation-delay:400ms]"
                       style={{ animationFillMode: 'forwards' }}
                     >
                         <h2 className="text-xl font-semibold mb-4 text-foreground">Zugehörige Links</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Link to find centers accepting this */}
                             <Link href={`/recycling-centers?material=${encodeURIComponent(material.name)}`}>
                                <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                                   <Building className="w-5 h-5 mr-3 flex-shrink-0 text-accent"/>
                                   <div>
                                        <span className="font-medium">Recyclinghöfe finden</span><br/>
                                        <span className="text-xs text-muted-foreground">Zeige Center, die {material.name} annehmen</span>
                                   </div>
                                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground"/>
                                </Button>
                            </Link>
                            {/* Link to marketplace listings for this */}
                            <Link href={`/marketplace?materialId=${encodeURIComponent(material.id)}&search=${encodeURIComponent(material.name)}`}> 
                                <Button variant="outline" className="w-full justify-start text-left h-auto py-3">
                                    <Store className="w-5 h-5 mr-3 flex-shrink-0 text-accent"/>
                                    <div>
                                        <span className="font-medium">Marktplatz anzeigen</span><br/>
                                        <span className="text-xs text-muted-foreground">Zeige Angebote für {material.name}</span>
                                    </div>
                                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground"/>
                                </Button>
                            </Link>
                         </div>
                     </div>
                   </div>
                </div>
            </div>
        );
    }

    return null; // Fallback
};

export default MaterialDetailPage; 