import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href: string;
};

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbNavigation({ items }: BreadcrumbNavigationProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.href}>
              <li>
                {isLast ? (
                  <span className="text-gray-700 font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link 
                    href={item.href} 
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              
              {!isLast && (
                <li>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
} 