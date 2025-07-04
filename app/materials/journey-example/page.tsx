'use client';

import React from 'react';
import MaterialJourney, { exampleJourneySteps, JourneyStep } from '@/components/materials/MaterialJourney';
import { 
  Recycle, 
  Truck, 
  Factory, 
  ShoppingBag, 
  Trash2, 
  Droplet, 
  Scissors
} from 'lucide-react';

// Example custom journeys for different materials
const aluminumJourneySteps: JourneyStep[] = [
  {
    id: 1,
    title: "Collection & Sorting",
    description: "Aluminum cans are collected from recycling bins and sorted from other materials.",
    icon: <Trash2 size={20} />,
    impact: "Diverts millions of cans from landfills"
  },
  {
    id: 2,
    title: "Shredding & Cleaning",
    description: "Cans are shredded and cleaned to remove coatings and contaminants.",
    icon: <Scissors size={20} />,
    energySaved: "Initial processing"
  },
  {
    id: 3,
    title: "Melting",
    description: "The shredded aluminum is melted in large furnaces at around 750°C.",
    icon: <Droplet size={20} />,
    energySaved: "95% less energy than virgin production"
  },
  {
    id: 4,
    title: "Casting into Ingots",
    description: "Molten aluminum is cast into large blocks called ingots.",
    icon: <Factory size={20} />,
    co2Reduced: "92% less CO₂ emissions"
  },
  {
    id: 5,
    title: "New Products",
    description: "Ingots are shipped to manufacturers to be made into new cans and products.",
    icon: <Recycle size={20} />,
    impact: "Aluminum can be recycled indefinitely"
  }
];

const plasticJourneySteps: JourneyStep[] = [
  {
    id: 1,
    title: "Collection",
    description: "Plastic items are collected from recycling bins and brought to sorting facilities.",
    icon: <ShoppingBag size={20} />,
    impact: "Reduces plastic pollution"
  },
  {
    id: 2,
    title: "Sorting",
    description: "Plastics are sorted by type (PET, HDPE, etc.) using optical sorting technology.",
    icon: <Trash2 size={20} />,
    energySaved: "Important for quality recycling"
  },
  {
    id: 3,
    title: "Washing & Grinding",
    description: "Plastics are washed to remove impurities and ground into small flakes.",
    icon: <Droplet size={20} />,
    co2Reduced: "~30-40% less than virgin plastic"
  },
  {
    id: 4,
    title: "Manufacturing",
    description: "Plastic flakes are melted and formed into pellets for new product manufacturing.",
    icon: <Factory size={20} />,
    energySaved: "~70% energy savings vs. virgin plastic"
  }
];

export default function JourneyExamplePage() {
  return (
    <div className="container mx-auto py-8 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-6">Material Recycling Journeys</h1>
        <p className="text-lg text-gray-700 mb-8">
          Explore the recycling process for different materials and learn about their environmental impact.
        </p>
      </div>

      <div className="space-y-8">
        <MaterialJourney 
          materialName="Generic Material" 
          materialType="Mixed Materials"
          journeySteps={exampleJourneySteps}
        />

        <MaterialJourney 
          materialName="Aluminum" 
          materialType="Metal"
          journeySteps={aluminumJourneySteps}
        />

        <MaterialJourney 
          materialName="Plastic" 
          materialType="PET"
          journeySteps={plasticJourneySteps}
        />
      </div>
    </div>
  );
} 