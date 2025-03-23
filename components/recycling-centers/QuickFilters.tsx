'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Material, groupMaterialsByCategory } from '@/lib/data/recycling';
import FilterModal from '@/components/FilterModal';
import { Recycle, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import SearchProvider from '@/components/SearchProvider';

interface QuickFiltersProps {
  className?: string;
  materials: Material[];
}

// Simple hook to manage search parameters - renamed to avoid conflicts with the global useSearch
const useFilterTags = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const materialsParam = searchParams.get('materials');
    return materialsParam ? materialsParam.split(',') : [];
  });

  // Update URL when selected tags change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedTags.length > 0) {
      params.set('materials', selectedTags.join(','));
    } else {
      params.delete('materials');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }, [selectedTags, router, pathname, searchParams]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return { selectedTags, toggleTag, clearFilters };
};

const QuickFilters: React.FC<QuickFiltersProps> = ({ className, materials }) => {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { selectedTags, toggleTag, clearFilters } = useFilterTags();

  // Group materials by category
  const materialsByCategory = groupMaterialsByCategory(materials);

  // Set isDesktop on the client side after component mounts
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // For desktop, show all categories; for mobile, respect the state
  const categories = Object.keys(materialsByCategory);
  const displayedCategories = showAllCategories || isDesktop
    ? categories
    : categories.slice(0, 4);

  return (
    <div className={`flex flex-col space-y-6 ${className || ''}`}>
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="mr-3 flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
        
        {/* Tags */}
        {displayedCategories.map((category) => (
          <CategoryTag
            key={category}
            category={category}
            materials={materialsByCategory[category]}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
          />
        ))}
        
        {/* Show more/less categories button */}
        {categories.length > 4 && !isDesktop && (
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-full hover:bg-green-100"
          >
            {showAllCategories ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          </button>
        )}
      </div>
      
      {/* Selected filters display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Aktive Filter:</span>
          {selectedTags.map((tag) => {
            // Find the material name that corresponds to this ID
            let materialName = tag;
            for (const category in materialsByCategory) {
              const material = materialsByCategory[category].find(m => m.id.toString() === tag);
              if (material) {
                materialName = material.name;
                break;
              }
            }
            
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className="flex items-center px-3 py-1 text-sm bg-green-50 text-green-700 rounded-full hover:bg-green-100"
              >
                {materialName}
                <span className="ml-2 text-green-600">&times;</span>
              </button>
            );
          })}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Alle zurücksetzen
          </button>
        </div>
      )}
      
      {/* Filter modal - wrapped in SearchProvider */}
      <SearchProvider>
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
        />
      </SearchProvider>
    </div>
  );
};

// Component for category tags
interface CategoryTagProps {
  category: string;
  materials: Material[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
}

const CategoryTag: React.FC<CategoryTagProps> = ({
  category,
  materials,
  selectedTags,
  toggleTag,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Count how many materials in this category are selected
  const selectedCount = materials.filter(material => 
    selectedTags.includes(material.id.toString())
  ).length;
  
  // Check if any material in this category is selected
  const hasSelected = selectedCount > 0;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          hasSelected 
            ? "bg-green-100 text-green-800 hover:bg-green-200" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {category}
        {hasSelected && (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-green-600 text-white rounded-full">
            {selectedCount}
          </span>
        )}
      </button>
      
      {isExpanded && (
        <div className="absolute z-10 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
          {materials.map((material) => (
            <button
              key={material.id}
              onClick={() => {
                toggleTag(material.id.toString());
                setIsExpanded(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                selectedTags.includes(material.id.toString()) ? "text-green-700 font-medium" : "text-gray-700"
              }`}
            >
              {material.name}
              {selectedTags.includes(material.id.toString()) && (
                <span className="ml-2 text-green-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickFilters; 