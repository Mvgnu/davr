'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Building, 
  ShoppingBag, 
  FileText, 
  Settings, 
  BarChart2, 
  LogOut 
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Benutzer', href: '/admin/users' },
  { icon: Building, label: 'Recyclingcenter', href: '/admin/recycling-centers' },
  { icon: ShoppingBag, label: 'Marktplatz', href: '/admin/marketplace' },
  { icon: FileText, label: 'Inhalte', href: '/admin/content' },
  { icon: BarChart2, label: 'Analysen', href: '/admin/analytics' },
  { icon: Settings, label: 'Einstellungen', href: '/admin/settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="flex flex-col h-full">
        <div className="px-6 py-6">
          <h1 className="text-xl font-bold text-gray-900">DAVR Admin</h1>
          <p className="text-sm text-gray-500">Verwaltungsbereich</p>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 rounded-md text-sm font-medium
                  ${isActive 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-2 w-full rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Abmelden
          </button>
          
          <div className="mt-4 px-3">
            <p className="text-xs text-gray-500">
              {new Date().getFullYear()} © DAVR Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 