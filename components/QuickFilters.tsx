import { useRouter, useSearchParams } from 'next/navigation';

const quickFilters = [
  { id: 'open-now', label: 'Jetzt geöffnet', param: 'hours', value: 'now' },
  { id: 'top-rated', label: 'Bestbewertet', param: 'rating', value: '4' },
  { id: 'aluminum', label: 'Aluminium', param: 'materials', value: 'aluminium' },
  { id: 'paper', label: 'Papier', param: 'materials', value: 'paper' },
  { id: 'glas', label: 'Glas', param: 'materials', value: 'glass' },
  { id: 'plastic', label: 'Plastik', param: 'materials', value: 'plastic' },
  { id: 'electronics', label: 'Elektronik', param: 'materials', value: 'electronics' },
  { id: 'hazardous', label: 'Sondermüll', param: 'materials', value: 'hazardous' },
  { id: 'bulky', label: 'Sperrmüll', param: 'materials', value: 'bulky' },
  { id: 'bio', label: 'Bioabfall', param: 'materials', value: 'bio' },
];

interface QuickFiltersProps {
  className?: string;
}

export default function QuickFilters({ className = '' }: QuickFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isFilterActive = (param: string, value: string): boolean => {
    const paramValue = searchParams?.get(param);
    if (param === 'materials') {
      return paramValue?.split(',').includes(value) || false;
    }
    return paramValue === value;
  };

  const toggleFilter = (param: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    
    if (param === 'materials') {
      const materials = current.get('materials')?.split(',') || [];
      if (materials.includes(value)) {
        const filtered = materials.filter(m => m !== value);
        if (filtered.length) {
          current.set('materials', filtered.join(','));
        } else {
          current.delete('materials');
        }
      } else {
        current.set('materials', [...materials, value].join(','));
      }
    } else {
      if (current.get(param) === value) {
        current.delete(param);
      } else {
        current.set(param, value);
      }
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    // Use the scroll:false option to prevent scroll reset
    router.push(`${window.location.pathname}${query}`, { 
      scroll: false 
    });
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {quickFilters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => toggleFilter(filter.param, filter.value)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
            ${isFilterActive(filter.param, filter.value)
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}