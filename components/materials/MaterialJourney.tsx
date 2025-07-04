'use client';

import React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowDown,
  Recycle,
  Truck,
  Factory,
  ShoppingBag,
  Leaf,
  Award,
  BarChart,
  Sparkles,
  Package,
} from 'lucide-react';

// Original JourneyStep type for existing components
export interface JourneyStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  impact?: string;
  energySaved?: string;
  co2Reduced?: string;
}

// New type to match the database structure
export interface DetailedJourneyStep {
  title: string;
  description: string;
  image_url: string;
  // Optional fields that might be in older data
  id?: number;
  impact?: string;
  energySaved?: string;
  co2Reduced?: string;
}

export interface MaterialJourneyProps {
  materialName: string;
  materialType: string;
  journeySteps: JourneyStep[] | DetailedJourneyStep[];
  className?: string;
}

// Helper to determine if a step is a DetailedJourneyStep (from DB)
function isDetailedStep(step: JourneyStep | DetailedJourneyStep): step is DetailedJourneyStep {
  return 'image_url' in step;
}

export default function MaterialJourney({
  materialName,
  materialType,
  journeySteps,
  className = '',
}: MaterialJourneyProps) {
  return (
    <Card className={`${className} overflow-hidden dark:bg-gray-800 dark:border-gray-700`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b dark:from-blue-900/30 dark:to-green-900/30 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl dark:text-white">{materialName}-Recycling: Der Kreislauf</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Verfolgen Sie den Weg vom Abfall zum neuen Produkt
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white/80 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 text-sm px-3 py-1">
            <Recycle className="w-4 h-4 mr-1" />
            {materialType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="relative">
          {/* Draw connecting lines BEHIND the steps */} 
          {journeySteps.map((_, index) => (
            index < journeySteps.length - 1 && (
              <div 
                key={`line-${index}`} 
                className="absolute left-6 w-0.5 bg-gray-200 dark:bg-gray-600" 
                style={{ 
                  // Start slightly below the center of the icon, end slightly above the next
                  top: `${index * 8 + 3.5}rem`, // Approximate position based on step height (adjust as needed)
                  height: '5rem' // Approximate height to reach the next step (adjust as needed)
                }}
              ></div>
            )
          ))}
          
          {/* Render steps ON TOP of the lines */} 
          <div className="space-y-8 relative z-10"> 
            {journeySteps.map((step, index) => {
              const stepId = isDetailedStep(step) ? index + 1 : step.id;
              
              return (
              <div key={stepId} className="flex items-start gap-4"> 
                  {/* Step icon or image */} 
                  {isDetailedStep(step) ? (
                    <div className="flex items-center justify-center w-12 h-12 rounded-full 
                                  bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 shrink-0 overflow-hidden">
                      {step.image_url ? (
                        <Image 
                          src={step.image_url}
                          alt={step.title}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 rounded-full 
                                  bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 shrink-0">
                      {step.icon}
                    </div>
                  )}

                  {/* Step content */} 
                  <div className="flex-grow pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-lg dark:text-white">{step.title}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Schritt {stepId}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{step.description}</p>

                    {/* Impact metrics */} 
                    {(step.impact || step.energySaved || step.co2Reduced) && (
                      <div className="bg-green-50 dark:bg-green-900/50 rounded-md p-3 mt-2">
                        <h4 className="flex items-center text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          <BarChart className="w-4 h-4 mr-1" /> Umweltfakten
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {step.impact && (
                            <div className="bg-white dark:bg-gray-700 rounded p-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Ressourcen</span>
                              <span className="font-medium dark:text-white">{step.impact}</span>
                            </div>
                          )}
                          {step.energySaved && (
                            <div className="bg-white dark:bg-gray-700 rounded p-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">Energieersparnis</span>
                              <span className="font-medium dark:text-white">{step.energySaved}</span>
                            </div>
                          )}
                          {step.co2Reduced && (
                            <div className="bg-white dark:bg-gray-700 rounded p-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400 block text-xs">CO₂-Reduktion</span>
                              <span className="font-medium dark:text-white">{step.co2Reduced}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            )})}
          </div>
        </div>

        {/* Final impact summary */}
        <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-medium dark:text-white">Nachhaltiger Beitrag</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Durch korrektes Recycling von {materialName.toLowerCase()} tragen Sie zum Klimaschutz, zur Ressourcenschonung und zur Reduktion von Abfallmengen bei. Die Kreislaufwirtschaft ist ein Schlüsselfaktor auf dem Weg zur Klimaneutralität in Deutschland.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Example usage (to help understand the component)
export const exampleJourneySteps: JourneyStep[] = [
  {
    id: 1,
    title: "Sammlung",
    description: "Materialien werden über Wertstofftonnen und Recyclinghöfe gesammelt.",
    icon: <ShoppingBag size={20} />,
    impact: "Vermeidung von Deponierungsabfällen"
  },
  {
    id: 2,
    title: "Transport",
    description: "Gesammelte Materialien werden zu Recyclinganlagen transportiert.",
    icon: <Truck size={20} />,
    co2Reduced: "~25% weniger als bei Neuproduktion"
  },
  {
    id: 3,
    title: "Aufbereitung",
    description: "Materialien werden sortiert, gereinigt und für die Wiederverwertung vorbereitet.",
    icon: <Factory size={20} />,
    energySaved: "~70% Energieeinsparung"
  },
  {
    id: 4,
    title: "Neue Produkte",
    description: "Aufbereitete Materialien werden zu neuen Produkten verarbeitet.",
    icon: <Recycle size={20} />,
    impact: "Reduzierter Bedarf an Primärrohstoffen"
  }
]; 