'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Recycle, Menu, X, UserCircle2, LogIn, Search, MapPin, Package, Store } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const pathname = usePathname()
  
  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])
  
  // Check if current path matches the link
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }
  
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-green-700 font-bold text-lg">
              <Recycle className="h-6 w-6 mr-2" />
              <span>Aluminium Recycling</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/recycling-centers" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/recycling-centers') 
                      ? 'bg-green-50 text-green-800' 
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Recyclinghöfe
                </Link>
                
                <Link 
                  href="/materials" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/materials') 
                      ? 'bg-green-50 text-green-800' 
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-1" />
                  Materialien
                </Link>
                
                <Link 
                  href="/marketplace" 
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/marketplace') 
                      ? 'bg-green-50 text-green-800' 
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <Store className="h-4 w-4 inline mr-1" />
                  Marktplatz
                </Link>
              </div>
            </div>
          </div>
          
          {/* Search and user actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              className="text-gray-600 hover:text-green-700 focus:outline-none"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/profile" 
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/profile') 
                      ? 'bg-green-50 text-green-800' 
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <UserCircle2 className="h-5 w-5" />
                  <span>{user?.name?.split(' ')[0] || 'Profil'}</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-1" />
                    Anmelden
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrieren</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="p-2 rounded-md text-gray-700 hover:bg-green-50 hover:text-green-700 focus:outline-none"
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
        <div className="md:hidden bg-white border-t border-gray-100 px-2 pt-2 pb-3 space-y-1">
          <Link 
            href="/recycling-centers" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/recycling-centers') 
                ? 'bg-green-50 text-green-800' 
                : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            <MapPin className="h-4 w-4 inline mr-2" />
            Recyclinghöfe
          </Link>
          
          <Link 
            href="/materials" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/materials') 
                ? 'bg-green-50 text-green-800' 
                : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Materialien
          </Link>
          
          <Link 
            href="/marketplace" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/marketplace') 
                ? 'bg-green-50 text-green-800' 
                : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            <Store className="h-4 w-4 inline mr-2" />
            Marktplatz
          </Link>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/profile" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/profile') 
                      ? 'bg-green-50 text-green-800' 
                      : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                  }`}
                >
                  <UserCircle2 className="h-4 w-4 inline mr-2" />
                  Mein Profil
                </Link>
              </>
            ) : (
              <div className="flex flex-col space-y-2 px-3">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full justify-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Anmelden
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full justify-center">
                    Registrieren
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 