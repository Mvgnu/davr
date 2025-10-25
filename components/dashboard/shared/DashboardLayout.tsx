'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { UserRole } from '@prisma/client';

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  pageTitle?: string;
  pageActions?: ReactNode;
}

export function DashboardLayout({
  children,
  role,
  user,
  breadcrumbs,
  pageTitle,
  pageActions,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar role={role} user={user} />

      <div className="lg:pl-64 lg:pt-16"> {/* Account for 64px navbar height on desktop */}
        <DashboardHeader
          user={user}
          breadcrumbs={breadcrumbs}
          pageTitle={pageTitle}
          pageActions={pageActions}
        />

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
