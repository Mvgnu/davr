'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

// Types
export interface User {
  id: string
  name?: string
  email?: string
  role?: string
  isAdmin?: boolean
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
  terms: boolean
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

// Provider component that uses NextAuth
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Use the NextAuth session
  const { data: session, status } = useSession()
  
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.user
  
  // Map the NextAuth user to our User type
  const user: User | null = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    role: session.user.role || 'user',
    isAdmin: session.user.isAdmin || false,
  } : null
  
  // Login function using NextAuth
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      
      return { 
        success: !result?.error,
        message: result?.error || undefined
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    }
  }
  
  // Register function - this would need to call your API endpoint first
  const register = async (data: RegisterData): Promise<RegisterResult> => {
    try {
      // First register the user via API
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await registerResponse.json()
      
      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Registrierung fehlgeschlagen.'
        }
      }
      
      // Then log them in automatically
      await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      })
      
      return { success: true }
    } catch (error) {
      console.error('Registration failed:', error)
      return { 
        success: false, 
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    }
  }
  
  // Logout function using NextAuth
  const logout = () => {
    signOut({ callbackUrl: '/' })
  }
  
  // Update user profile - would call your API
  const updateUserProfile = async (data: ProfileData): Promise<ProfileUpdateResult> => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      return {
        success: result.success,
        message: result.message
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      return {
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
      }
    }
  }
  
  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      login,
      register,
      logout,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
} 