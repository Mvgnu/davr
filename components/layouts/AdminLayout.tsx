'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Settings, Recycle, Users, FileText, PanelLeft } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <Recycle className="h-6 w-6" />
            <span className="font-bold">Admin Dashboard</span>
          </Link>
        </div>
        <nav className="space-y-1 px-2 py-4">
          <Link
            href="/admin/recycling-centers"
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/admin/recycling-centers')}`}
          >
            <Recycle className="mr-3 h-5 w-5" />
            Recycling Centers
          </Link>
          <Link
            href="/admin/materials"
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/admin/materials')}`}
          >
            <FileText className="mr-3 h-5 w-5" />
            Materials
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/admin/users')}`}
          >
            <Users className="mr-3 h-5 w-5" />
            Users
          </Link>
          <Link
            href="/admin/settings"
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${isActive('/admin/settings')}`}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>

          <div className="pt-6">
            <div className="border-t border-border pt-4">
              <Link
                href="/auth/signout"
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center">
            <button className="mr-4 md:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </button>
            <h1 className="text-lg font-medium">Admin Dashboard</h1>
          </div>
          <div className="flex items-center">
            <button className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
} 