'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@prisma/client';
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  MessageSquare,
  Building2,
  Package,
  Clock,
  Star,
  Users,
  Shield,
  Flag,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  FileText,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  role: UserRole;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const getUserNavigation = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'USER':
      return [
        {
          label: 'Overview',
          href: '/dashboard/user',
          icon: LayoutDashboard,
        },
        {
          label: 'Profile',
          href: '/dashboard/user/profile',
          icon: User,
        },
        {
          label: 'My Listings',
          href: '/dashboard/user/listings',
          icon: ShoppingBag,
        },
        {
          label: 'My Reviews',
          href: '/dashboard/user/reviews',
          icon: Star,
        },
      ];

    case 'CENTER_OWNER':
      return [
        {
          label: 'My Centers',
          href: '/dashboard/owner',
          icon: Building2,
        },
        {
          label: 'Profile',
          href: '/dashboard/owner/profile',
          icon: User,
        },
      ];

    case 'ADMIN':
      return [
        {
          label: 'Dashboard',
          href: '/dashboard/admin',
          icon: LayoutDashboard,
        },
        {
          label: 'Users',
          href: '/dashboard/admin/users',
          icon: Users,
        },
        {
          label: 'Listings',
          href: '/dashboard/admin/listings',
          icon: ShoppingBag,
        },
        {
          label: 'Centers',
          href: '/dashboard/admin/centers',
          icon: Building2,
        },
        {
          label: 'Materials',
          href: '/dashboard/admin/materials',
          icon: Package,
        },
        {
          label: 'Blog',
          href: '/dashboard/admin/blog',
          icon: FileText,
        },
        {
          label: 'Claims',
          href: '/dashboard/admin/claims',
          icon: Wrench,
        },
        {
          label: 'Analytics',
          href: '/dashboard/admin/analytics',
          icon: Star,
        },
        {
          label: 'Messages',
          href: '/dashboard/admin/messages',
          icon: MessageSquare,
        },
        {
          label: 'Settings',
          href: '/dashboard/admin/settings',
          icon: Wrench,
        },
      ];

    default:
      return [];
  }
};

export function DashboardSidebar({ role, user }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const navigation = getUserNavigation(role);

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center justify-between px-6 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="font-semibold text-lg">DAVR</span>
        </Link>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Navigation
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <span className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Links
          </p>
          <Link
            href="/"
            className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Site</span>
          </Link>
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar>
            <AvatarImage src={user.image || undefined} alt={user.name || ''} />
            <AvatarFallback className="bg-green-600 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-gray-700"
          asChild
        >
          <Link href="/api/auth/signout">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 flex items-center justify-between h-16 px-4 bg-white border-b"> {/* Account for 64px navbar height */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="font-semibold text-lg">DAVR</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white top-16" style={{height: 'calc(100vh - 4rem)'}}> {/* Account for 64px navbar height (4rem = 64px) */}
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r top-0 lg:top-16"> {/* Account for 64px navbar height */}
        <SidebarContent />
      </div>
    </>
  );
}
