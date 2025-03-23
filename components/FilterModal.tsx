'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FunnelIcon, AdjustmentsVerticalIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { useSearch } from '@/components/SearchProvider';
import { Switch } from '@headlessui/react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const { 
    materials, setMaterials,
    distance, setDistance,
    rating, setRating,
    openNow, setOpenNow,
    applyFilters,
    resetFilters,
    isFilterActive
  } = useSearch();
  
  // Use direct context values instead of local state
  // This allows auto-applying as changes are made
  
  // Toggle a material directly in the context
  const toggleMaterial = (materialId: string) => {
    const updatedMaterials = materials.includes(materialId)
      ? materials.filter(id => id !== materialId)
      : [...materials, materialId];
    
    setMaterials(updatedMaterials);
    applyFilters(); // Apply filters immediately
  };
  
  // Apply rating change immediately
  const handleRatingChange = (value: number) => {
    setRating(value);
    applyFilters(); // Apply filters immediately
  };
  
  // Toggle open now and apply immediately
  const toggleOpenNow = () => {
    setOpenNow(!openNow);
    applyFilters(); // Apply filters immediately
  };
  
  // Toggle distance and apply immediately
  const handleDistanceChange = (value: number) => {
    setDistance(value);
    applyFilters(); // Apply filters immediately
  };
  
  // Reset filters and close modal
  const handleResetFilters = () => {
    resetFilters();
    onClose();
  };
  
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 flex items-center">
                    <FunnelIcon className="h-5 w-5 mr-2 text-green-600" />
                    Filter für Wertstoffhöfe
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Materials Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <AdjustmentsVerticalIcon className="h-4 w-4 mr-1.5 text-green-600" />
                      Akzeptierte Materialien
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {materialOptions.map((material) => (
                        <button
                          key={material.id}
                          onClick={() => toggleMaterial(material.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 
                            ${materials.includes(material.id)
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                            } border`}
                        >
                          {material.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1.5 text-red-500" />
                      Maximale Entfernung
                    </h4>
                    <div className="px-2">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={distance}
                        onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1 km</span>
                        <span>{distance} km</span>
                        <span>50 km</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Minimum Rating */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <StarIcon className="h-4 w-4 mr-1.5 text-yellow-500" />
                      Mindestbewertung
                    </h4>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleRatingChange(value)}
                          className={`flex items-center px-3 py-1.5 rounded-lg border transition-all
                            ${value === rating
                              ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            } ${value === 0 ? 'text-sm' : ''}`}
                        >
                          {value === 0 ? (
                            'Alle'
                          ) : (
                            <>
                              {value}
                              <StarIcon className="h-4 w-4 ml-1 text-yellow-500" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Open Now Filter */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-blue-500 mr-1.5" />
                      <span className="text-sm font-medium text-gray-700">Jetzt geöffnet</span>
                    </div>
                    <Switch
                      checked={openNow}
                      onChange={toggleOpenNow}
                      className={`${openNow ? 'bg-green-600' : 'bg-gray-200'} 
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                      <span
                        className={`${openNow ? 'translate-x-6' : 'translate-x-1'} 
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                  
                  <div className="flex justify-end mt-8 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Filter zurücksetzen
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default FilterModal; 