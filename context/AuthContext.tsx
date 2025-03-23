'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react'
import Cookies from 'js-cookie'

// Types
export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'recyclingCenter' | 'admin'
  phone?: string
  address?: string
  city?: string
  zipCode?: string
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}

interface LoginResult {
  success: boolean
  message?: string
}

interface RegisterResult {
  success: boolean
  message?: string
}

interface ProfileUpdateResult {
  success: boolean
  message?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role: 'user' | 'recyclingCenter'
}

export interface ProfileData {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  zipCode?: string
}

export interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  register: (data: RegisterData) => Promise<RegisterResult>
  logout: () => void
  updateUserProfile: (data: ProfileData) => Promise<ProfileUpdateResult>
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  updateUserProfile: async () => ({ success: false }),
})

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

// Provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })

  // Function to check if user is authenticated
  const checkAuth = async () => {
    try {
      const token = Cookies.get('auth_token')
      
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        })
        return
      }
      
      // Simulate fetching user data
      // In a real application, you would make an API call to validate the token and get user data
      setTimeout(() => {
        // This is just mock data for demonstration
        const mockUser: User = {
          id: '1',
          name: 'Max Mustermann',
          email: 'max@example.com',
          role: 'user',
          phone: '+49 123 4567890',
          address: 'Musterstraße 123',
          city: 'Berlin',
          zipCode: '10115',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:00:00Z',
        }
        
        setAuthState({
          isAuthenticated: true,
          user: mockUser,
          isLoading: false,
        })
      }, 1000)
      
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      })
    }
  }

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Login function
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      // Simulate API call
      // In a real application, this would be an actual API request
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock successful login for demo
          if (email === 'demo@example.com' && password === 'password') {
            const mockUser: User = {
              id: '1',
              name: 'Demo User',
              email: 'demo@example.com',
              role: 'user',
            }
            
            // Set cookie (in a real app, this token would come from your backend)
            Cookies.set('auth_token', 'demo_token', { expires: 7 })
            
            setAuthState({
              isAuthenticated: true,
              user: mockUser,
              isLoading: false,
            })
            
            resolve({ success: true })
          } else {
            resolve({ 
              success: false, 
              message: 'Ungültige E-Mail oder Passwort'
            })
          }
        }, 1000)
      })
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    }
  }

  // Register function
  const register = async (data: RegisterData): Promise<RegisterResult> => {
    try {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock successful registration
          const mockUser: User = {
            id: '1',
            name: data.name,
            email: data.email,
            role: data.role,
          }
          
          // Set cookie
          Cookies.set('auth_token', 'demo_token', { expires: 7 })
          
          setAuthState({
            isAuthenticated: true,
            user: mockUser,
            isLoading: false,
          })
          
          resolve({ success: true })
        }, 1000)
      })
    } catch (error) {
      console.error('Registration failed:', error)
      return { 
        success: false, 
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    }
  }

  // Logout function
  const logout = () => {
    Cookies.remove('auth_token')
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    })
  }

  // Update user profile
  const updateUserProfile = async (data: ProfileData): Promise<ProfileUpdateResult> => {
    try {
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          if (authState.user) {
            const updatedUser: User = {
              ...authState.user,
              ...data,
              updatedAt: new Date().toISOString()
            }
            
            setAuthState({
              ...authState,
              user: updatedUser,
            })
            
            resolve({ success: true })
          } else {
            resolve({ 
              success: false, 
              message: 'Benutzer nicht gefunden'
            })
          }
        }, 1000)
      })
    } catch (error) {
      console.error('Profile update failed:', error)
      return { 
        success: false, 
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        isLoading: authState.isLoading,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
} 