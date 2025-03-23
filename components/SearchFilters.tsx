import { Fragment, useState } from 'react';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useSearchParams, useRouter } from 'next/navigation';

const materials = [
  { value: 'aluminum', label: 'Aluminium' },
  { value: 'plastic', label: 'Kunststoff' },
  { value: 'paper', label: 'Papier' },
  { value: 'glass', label: 'Glas' },
  { value: 'metal', label: 'Metall' },
  { value: 'electronics', label: 'Elektronik' },
];

const ratings = [
  { value: '4', label: '4+ Sterne' },
  { value: '3', label: '3+ Sterne' },
  { value: '2', label: '2+ Sterne' },
];

const openingHours = [
  { value: 'now', label: 'Jetzt geöffnet' },
  { value: 'weekend', label: 'Am Wochenende geöffnet' },
  { value: '24h', label: '24/7 geöffnet' },
];

interface SearchFiltersProps {
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (open: boolean) => void;
  className?: string;
}

export default function SearchFilters({
  mobileFiltersOpen,
  setMobileFiltersOpen,
  className = ''
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(
    searchParams?.get('materials')?.split(',').filter(Boolean) || []
  );
  const [selectedRating, setSelectedRating] = useState(
    searchParams?.get('rating') || ''
  );
  const [selectedHours, setSelectedHours] = useState(
    searchParams?.get('hours') || ''
  );

  const updateFilters = (type: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    
    switch (type) {
      case 'materials':
        const materials = selectedMaterials.includes(value)
          ? selectedMaterials.filter(m => m !== value)
          : [...selectedMaterials, value];
        setSelectedMaterials(materials);
        if (materials.length) {
          current.set('materials', materials.join(','));
        } else {
          current.delete('materials');
        }
        break;
      case 'rating':
        const newRating = selectedRating === value ? '' : value;
        setSelectedRating(newRating);
        if (newRating) {
          current.set('rating', newRating);
        } else {
          current.delete('rating');
        }
        break;
      case 'hours':
        const newHours = selectedHours === value ? '' : value;
        setSelectedHours(newHours);
        if (newHours) {
          current.set('hours', newHours);
        } else {
          current.delete('hours');
        }
        break;
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${window.location.pathname}${query}`, {
      scroll: false
    });
  };

  const filters = [
    {
      id: 'materials',
      name: 'Materialien',
      options: materials,
      selectedValues: selectedMaterials,
      onChange: (value: string) => updateFilters('materials', value)
    },
    {
      id: 'rating',
      name: 'Bewertung',
      options: ratings,
      selectedValues: [selectedRating],
      onChange: (value: string) => updateFilters('rating', value)
    },
    {
      id: 'hours',
      name: 'Öffnungszeiten',
      options: openingHours,
      selectedValues: [selectedHours],
      onChange: (value: string) => updateFilters('hours', value)
    }
  ];

  return (
    <div className={className}>
      {/* Mobile filter dialog */}
      <Transition.Root show={mobileFiltersOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setMobileFiltersOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 z-40 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-6 shadow-xl">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-medium text-gray-900">Filter</h2>
                  <button
                    type="button"
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <span className="sr-only">Schließen</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Filters */}
                <form className="mt-4">
                  {filters.map((section) => (
                    <Disclosure as="div" key={section.id} className="border-t border-gray-200 px-4 py-6">
                      {({ open }) => (
                        <>
                          <h3 className="-mx-2 -my-3 flow-root">
                            <Disclosure.Button className="flex w-full items-center justify-between bg-white px-2 py-3 text-sm text-gray-400">
                              <span className="font-medium text-gray-900">{section.name}</span>
                              <span className="ml-6 flex items-center">
                                <ChevronDownIcon
                                  className={`h-5 w-5 transform ${open ? '-rotate-180' : 'rotate-0'}`}
                                  aria-hidden="true"
                                />
                              </span>
                            </Disclosure.Button>
                          </h3>
                          <Disclosure.Panel className="pt-6">
                            <div className="space-y-6">
                              {section.options.map((option, optionIdx) => (
                                <div key={option.value} className="flex items-center">
                                  <input
                                    id={`filter-mobile-${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    value={option.value}
                                    type="checkbox"
                                    checked={section.selectedValues.includes(option.value)}
                                    onChange={() => section.onChange(option.value)}
                                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <label
                                    htmlFor={`filter-mobile-${section.id}-${optionIdx}`}
                                    className="ml-3 text-sm text-gray-500"
                                  >
                                    {option.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop filters */}
      <form className="hidden lg:block">
        {filters.map((section) => (
          <Disclosure as="div" key={section.id} className="border-b border-gray-200 py-6">
            {({ open }) => (
              <>
                <h3 className="-my-3 flow-root">
                  <Disclosure.Button className="flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500">
                    <span className="font-medium text-gray-900">{section.name}</span>
                    <span className="ml-6 flex items-center">
                      <ChevronDownIcon
                        className={`h-5 w-5 transform ${open ? '-rotate-180' : 'rotate-0'}`}
                        aria-hidden="true"
                      />
                    </span>
                  </Disclosure.Button>
                </h3>
                <Disclosure.Panel className="pt-6">
                  <div className="space-y-4">
                    {section.options.map((option, optionIdx) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          id={`filter-${section.id}-${optionIdx}`}
                          name={`${section.id}[]`}
                          value={option.value}
                          type="checkbox"
                          checked={section.selectedValues.includes(option.value)}
                          onChange={() => section.onChange(option.value)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label
                          htmlFor={`filter-${section.id}-${optionIdx}`}
                          className="ml-3 text-sm text-gray-600"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        ))}
      </form>
    </div>
  );
} 