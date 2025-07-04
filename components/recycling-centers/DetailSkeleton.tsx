'use client';

import React from 'react';

/**
 * Skeleton loading component for the recycling center detail page
 * Displays animated placeholder content while the main content is loading
 */
const DetailSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="relative h-56 sm:h-64 md:h-72 bg-gray-200">
        <div className="absolute bottom-0 left-0 p-6">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
      
      {/* Rating badges skeleton */}
      <div className="border-b border-gray-200">
        <div className="flex flex-wrap justify-between items-center px-6 py-3">
          <div className="flex items-center space-x-3">
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-28"></div>
          </div>
        </div>
        
        {/* Navigation tabs skeleton */}
        <div className="flex px-6 border-b border-gray-200">
          <div className="py-3 px-4 border-b-2 border-green-500">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
        
        {/* Two-column layout skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="flex">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="flex">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/4"></div>
                </div>
              </div>
              <div className="flex">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/5"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Materials grid skeleton */}
        <div className="mt-8">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSkeleton; 