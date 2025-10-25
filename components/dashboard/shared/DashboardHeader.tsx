'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  breadcrumbs?: Breadcrumb[];
  pageTitle?: string;
  pageActions?: ReactNode;
}

export function DashboardHeader({
  breadcrumbs,
  pageTitle,
  pageActions,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b mt-16 lg:mt-0"> {/* Keep mobile margin but remove for desktop since sidebar accounts for navbar */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                  {breadcrumb.href ? (
                    <Link
                      href={breadcrumb.href}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {breadcrumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {pageTitle && (
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            {pageActions && <div>{pageActions}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
