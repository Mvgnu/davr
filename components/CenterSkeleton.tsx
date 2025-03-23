import React from 'react';

const CenterSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-12 bg-gray-200 rounded-full"></div>
          <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default CenterSkeleton; 