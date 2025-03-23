'use client';

import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
    </div>
  );
} 