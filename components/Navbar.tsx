'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthStatus from '@/components/auth/AuthStatus'
import { Recycle, Menu, X, MapPin, Package, Store } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false)
    }
  }, [pathname])
  
  const isActive = (path: string) => {
    if (!pathname) return false;
    return pathname === path || pathname.startsWith(`${path}/`);
  }
  
  return (
    <nav className="bg-card text-card-foreground shadow-sm sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-accent font-bold text-lg">
              <Recycle className="h-6 w-6 mr-2" />
              <span>DAVR</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/recycling-centers" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/recycling-centers') 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Recyclinghöfe
                </Link>
                
                <Link 
                  href="/materials" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/materials') 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-1" />
                  Materialien
                </Link>
                
                <Link 
                  href="/marketplace" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/marketplace') 
                      ? 'bg-secondary text-secondary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Store className="h-4 w-4 inline mr-1" />
                  Marktplatz
                </Link>
                {isAuthenticated && (
                  <Link 
                    href="/dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* User actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <AuthStatus />
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <ThemeToggle className="mr-2" />
            <button
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-t border-border px-2 pt-2 pb-3 space-y-1">
          <Link href="/recycling-centers" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/recycling-centers') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}><MapPin className="h-4 w-4 inline mr-2" />Recyclinghöfe</Link>
          <Link href="/materials" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/materials') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}><Package className="h-4 w-4 inline mr-2" />Materialien</Link>
          <Link href="/marketplace" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/marketplace') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}><Store className="h-4 w-4 inline mr-2" />Marktplatz</Link>
          {isAuthenticated && <Link href="/dashboard" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>Dashboard</Link>}
          
          <div className="pt-4 pb-3 border-t border-border px-3">
            <AuthStatus />
          </div>
        </div>
      )}
    </nav>
  )
} 