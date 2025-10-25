import React from 'react';

export default function MaterialsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Hero Skeleton */}
      <section className="relative mb-12 overflow-hidden">
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-2xl px-6 py-10 md:px-8 md:py-12">
          {/* Headline Skeleton */}
          <div className="max-w-3xl mb-8 space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-full animate-pulse" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar Skeleton */}
      <div className="mb-8 space-y-6">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg max-w-2xl animate-pulse" />

        {/* Quick Filters Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5 space-y-4 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary Skeleton */}
      <div className="mb-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
          >
            {/* Image Skeleton */}
            <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
