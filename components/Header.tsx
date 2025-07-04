'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function Header() {
  const { isAuthenticated, user, isLoading, logout } = useAuth()
  const pathname = usePathname()
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Dropdown states
  const [recyclingDropdown, setRecyclingDropdown] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close dropdowns if clicking inside them
      const target = event.target as Node;
      const recyclingDropdownElement = document.getElementById('recycling-dropdown');
      const userDropdownElement = document.getElementById('user-dropdown');
      const recyclingButton = document.getElementById('recycling-button');
      const userButton = document.getElementById('user-button');
      
      if (recyclingDropdownElement && !recyclingDropdownElement.contains(target) && 
          recyclingButton && !recyclingButton.contains(target)) {
        setRecyclingDropdown(false);
      }
      
      if (userDropdownElement && !userDropdownElement.contains(target) && 
          userButton && !userButton.contains(target)) {
        setUserDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Navigation links
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Recycling-Zentren', href: '/recycling-centers' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Forum', href: '/forum' },
    { name: 'Blog', href: '/blog' },
  ]
  
  // Recycling dropdown items
  const recyclingLinks = [
    { name: 'Alle Recycling-Zentren', href: '/recycling-centers' },
    { name: 'Aluminium', href: '/recycling-centers?materials=aluminium' },
    { name: 'Papier', href: '/recycling-centers?materials=paper' },
    { name: 'Plastik', href: '/recycling-centers?materials=plastic' },
    { name: 'Glas', href: '/recycling-centers?materials=glass' },
    { name: 'Elektronik', href: '/recycling-centers?materials=electronics' },
    { name: 'Berlin', href: '/recycling-centers/berlin' },
    { name: 'Hamburg', href: '/recycling-centers/hamburg' },
    { name: 'München', href: '/recycling-centers/münchen' },
  ]
  
  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }
  
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">
                D
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">
                DAVR
              </span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navigation.map((item, index) => {
              // Special case for recycling-centers with dropdown
              if (item.href === '/recycling-centers') {
                return (
                  <div key={item.name} className="relative">
                    <button 
                      id="recycling-button"
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                        isActive(item.href) 
                          ? 'border-green-500 text-gray-900' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setRecyclingDropdown(!recyclingDropdown)
                      }}
                    >
                      {item.name}
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                    </button>
                    
                    {/* Recycling Dropdown */}
                    {recyclingDropdown && (
                      <div 
                        id="recycling-dropdown"
                        className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                      >
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                          {recyclingLinks.map((link) => (
                            <Link
                              key={link.name}
                              href={link.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                setRecyclingDropdown(false)
                              }}
                            >
                              {link.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              
              // Regular navigation items
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                    isActive(item.href) 
                      ? 'border-green-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
            
            {/* Auth Buttons */}
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <div className="relative ml-3">
                    <button
                      id="user-button"
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation()
                        setUserDropdown(!userDropdown)
                      }}
                    >
                      <span className="sr-only">Open user menu</span>
                      <UserCircleIcon className="h-6 w-6 mr-1" />
                      <span className="truncate max-w-[100px]">{user.name}</span>
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                    </button>
                    
                    {/* User Dropdown */}
                    {userDropdown && (
                      <div 
                        id="user-dropdown"
                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                      >
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              setUserDropdown(false)
                            }}
                          >
                            Mein Profil
                          </Link>
                          <Link
                            href="/profile/favorites"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              setUserDropdown(false)
                            }}
                          >
                            Favoriten
                          </Link>
                          {/* Admin link - only show if user has role admin */}
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                setUserDropdown(false)
                              }}
                            >
                              <ShieldCheckIcon className="mr-2 h-4 w-4" />
                              Admin-Bereich
                            </Link>
                          )}
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              logout()
                              setUserDropdown(false)
                            }}
                          >
                            <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                            Abmelden
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link 
                      href="/auth/login" 
                      className="text-gray-500 hover:text-gray-900 text-sm font-medium"
                    >
                      Anmelden
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Registrieren
                    </Link>
                  </div>
                )}
              </>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Recycling subcategories */}
            <div className="pl-6 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">
                Recycling Kategorien
              </p>
              {recyclingLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            {/* Auth section for mobile */}
            {!isLoading && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                {isAuthenticated && user ? (
                  <div>
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{user.name}</div>
                        <div className="text-sm font-medium text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Mein Profil
                      </Link>
                      <Link
                        href="/profile/favorites"
                        className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Favoriten
                      </Link>
                      {/* Admin link - only show if user has role admin */}
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ShieldCheckIcon className="mr-2 h-5 w-5" />
                          Admin-Bereich
                        </Link>
                      )}
                      <button
                        className="flex w-full items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                      >
                        <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                        Abmelden
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 px-4">
                    <Link
                      href="/auth/login"
                      className="block text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-4 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Anmelden
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block text-base font-medium bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Registrieren
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
} 