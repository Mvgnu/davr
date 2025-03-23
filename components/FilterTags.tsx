'use client';

import React from 'react';
import { TagIcon } from '@heroicons/react/24/solid';
import { useSearch } from '@/components/SearchProvider';

interface FilterTagsProps {
  darkMode?: boolean;
}

// Material options for recycling centers
const materialOptions = [
  { id: 'aluminium', label: 'Aluminium' },
  { id: 'paper', label: 'Papier' },
  { id: 'glass', label: 'Glas' },
  { id: 'plastic', label: 'Plastik' },
  { id: 'electronics', label: 'Elektronik' },
  { id: 'hazardous', label: 'Sondermüll' },
  { id: 'bulky', label: 'Sperrmüll' },
  { id: 'bio', label: 'Bioabfall' },
];

const FilterTags: React.FC<FilterTagsProps> = ({ darkMode = false }) => {
  const { materials, setMaterials, applyFilters } = useSearch();

  const toggleMaterial = (materialId: string) => {
    const updatedMaterials = materials.includes(materialId)
      ? materials.filter(id => id !== materialId)
      : [...materials, materialId];
    
    setMaterials(updatedMaterials);
    applyFilters();
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-2">
        <TagIcon className={`h-4 w-4 mr-1.5 ${darkMode ? 'text-white/70' : 'text-gray-500'}`} />
        <span className={`text-sm font-medium ${darkMode ? 'text-white/90' : 'text-gray-700'}`}>
          Material filtern:
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {materialOptions.map((material) => {
          const isSelected = materials.includes(material.id);
          return (
            <button
              key={material.id}
              onClick={() => toggleMaterial(material.id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                ${isSelected 
                  ? (darkMode 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-100 text-green-800 border-green-300')
                  : (darkMode 
                      ? 'bg-white/10 text-white/90 hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200')
                }
                ${darkMode ? 'border border-transparent' : 'border'}
              `}
            >
              {material.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterTags; 