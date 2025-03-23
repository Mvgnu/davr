'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, Mail, MapPin, Phone, Building, ArrowLeft, Save, AlertCircle, Settings, Package, Star, ShoppingBag, Heart, LogOut, Edit, Camera } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Mein Profil | DAVR',
  description: 'Verwalten Sie Ihr DAVR-Konto, Ihre Angebote und Einstellungen.',
}

// Sample user data - to be replaced with actual authentication and data fetching
const userData = {
  id: '1',
  name: 'Max Mustermann',
  email: 'max.mustermann@example.com',
  phone: '+49 123 4567890',
  location: 'Berlin, Deutschland',
  avatar: '/images/placeholder/avatar.jpg',
  joinDate: new Date('2022-03-15'),
  isVerified: true,
  rating: {
    average: 4.7,
    count: 23
  },
  bio: 'Ich bin leidenschaftlich daran interessiert, Materialien zu recyceln und wiederzuverwenden. Als gelernter Metallverarbeiter biete ich hochwertige Materialien an und bin immer auf der Suche nach neuen Möglichkeiten.',
  listings: [
    {
      id: '1',
      title: 'Hochwertige Aluminiumprofile',
      price: 5.75,
      unit: 'kg',
      image: '/images/placeholder/aluminum-profiles.jpg',
      status: 'active',
      createdAt: new Date('2023-06-15'),
      views: 45,
      interested: 3
    },
    {
      id: '2',
      title: 'Kupferkabel (ohne Isolation)',
      price: 7.25,
      unit: 'kg',
      image: '/images/placeholder/copper-wire.jpg',
      status: 'active',
      createdAt: new Date('2023-06-10'),
      views: 32,
      interested: 1
    },
    {
      id: '3',
      title: 'Messingschrott gemischt',
      price: 4.30,
      unit: 'kg',
      image: '/images/placeholder/brass-scrap.jpg',
      status: 'sold',
      createdAt: new Date('2023-05-20'),
      views: 67,
      interested: 5
    }
  ],
  savedListings: [
    {
      id: '4',
      title: 'Aluminiumfelgen (gebraucht)',
      price: 3.80,
      unit: 'kg',
      image: '/images/placeholder/aluminum-wheels.jpg',
      seller: 'Auto-Parts Recycling',
      location: 'Köln',
      createdAt: new Date('2023-06-14')
    },
    {
      id: '5',
      title: 'Edelstahlbleche 2mm',
      price: 2.50,
      unit: 'kg',
      image: '/images/placeholder/stainless-steel.jpg',
      seller: 'Metallhandel Müller',
      location: 'Hamburg',
      createdAt: new Date('2023-06-08')
    }
  ]
}

// Function to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

export default function ProfilePage() {
  const { user, isLoading, logout, updateUserProfile } = useAuth()
  const router = useRouter()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
  })
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
    
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        zipCode: user.zipCode || '',
      })
    }
  }, [user, isLoading, router])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    
    try {
      const result = await updateUserProfile(profileData)
      if (result.success) {
        setSuccess('Profil erfolgreich aktualisiert')
        setIsEditing(false)
      } else {
        setError(result.message || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }
  
  if (!user) {
    return null // Router will redirect, this prevents flash of content
  }
  
  return (
    <div className="bg-white">
      <div className="bg-gradient-to-b from-green-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Profile Sidebar */}
              <div className="w-full md:w-1/3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="relative mb-4">
                        <Avatar className="w-24 h-24">
                          <AvatarImage 
                            src={userData.avatar} 
                            alt={userData.name} 
                          />
                          <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="absolute -bottom-2 -right-2 rounded-full bg-white"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <h1 className="text-xl font-semibold">{userData.name}</h1>
                      {userData.isVerified && (
                        <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                          Verifizierter Benutzer
                        </Badge>
                      )}
                      
                      {userData.rating && (
                        <div className="flex items-center mt-2">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                          <span className="text-sm font-medium">{userData.rating.average}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({userData.rating.count} Bewertungen)
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {userData.location}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2">
                        Mitglied seit {formatDate(userData.joinDate)}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <Link href="/profile/edit">
                        <Button variant="outline" className="w-full justify-start">
                          <Edit className="mr-2 h-4 w-4" />
                          Profil bearbeiten
                        </Button>
                      </Link>
                      <Link href="/profile/settings">
                        <Button variant="outline" className="w-full justify-start">
                          <Settings className="mr-2 h-4 w-4" />
                          Einstellungen
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        Abmelden
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Kontaktinformationen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">E-Mail</p>
                        <p className="text-sm text-gray-600">{userData.email}</p>
                      </div>
                      {userData.phone && (
                        <div>
                          <p className="text-sm font-medium">Telefon</p>
                          <p className="text-sm text-gray-600">{userData.phone}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main Content */}
              <div className="w-full md:w-2/3">
                <Tabs defaultValue="listings">
                  <TabsList className="grid grid-cols-3 mb-8">
                    <TabsTrigger value="listings">Meine Angebote</TabsTrigger>
                    <TabsTrigger value="saved">Gespeicherte</TabsTrigger>
                    <TabsTrigger value="about">Über mich</TabsTrigger>
                  </TabsList>
                  
                  {/* My Listings Tab */}
                  <TabsContent value="listings">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Meine Angebote</h2>
                      <Link href="/marketplace/create">
                        <Button>
                          Neues Angebot
                        </Button>
                      </Link>
                    </div>
                    
                    {userData.listings.length > 0 ? (
                      <div className="space-y-4">
                        {userData.listings.map(listing => (
                          <Card key={listing.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/4 h-40 md:h-auto relative">
                                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">Bild</span>
                                </div>
                                {listing.image && (
                                  <Image
                                    src={listing.image}
                                    alt={listing.title}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                                {listing.status === 'sold' && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <span className="text-white font-semibold">Verkauft</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold">{listing.title}</h3>
                                    <p className="text-green-700 font-bold">
                                      {listing.price.toFixed(2)} €/{listing.unit}
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={listing.status === 'active' ? 'default' : 'outline'}
                                    className={
                                      listing.status === 'active' 
                                        ? 'bg-green-500 hover:bg-green-600' 
                                        : 'bg-gray-100 text-gray-600'
                                    }
                                  >
                                    {listing.status === 'active' ? 'Aktiv' : 'Verkauft'}
                                  </Badge>
                                </div>
                                
                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <span className="font-medium mr-1">Erstellt:</span>
                                    {formatDate(listing.createdAt)}
                                  </div>
                                  <div className="flex items-center">
                                    <span className="font-medium mr-1">Aufrufe:</span>
                                    {listing.views}
                                  </div>
                                  <div className="flex items-center">
                                    <span className="font-medium mr-1">Interessenten:</span>
                                    {listing.interested}
                                  </div>
                                </div>
                                
                                <div className="mt-4 flex gap-2">
                                  <Link href={`/marketplace/listings/${listing.id}/edit`}>
                                    <Button variant="outline" size="sm">
                                      Bearbeiten
                                    </Button>
                                  </Link>
                                  {listing.status === 'active' ? (
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                      Deaktivieren
                                    </Button>
                                  ) : (
                                    <Button variant="outline" size="sm">
                                      Neu einstellen
                                    </Button>
                                  )}
                                  <Link href={`/marketplace/listings/${listing.id}`}>
                                    <Button variant="ghost" size="sm">
                                      Ansehen
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Angebote vorhanden</h3>
                        <p className="text-gray-600 mb-6">
                          Sie haben noch keine Materialien zum Verkauf angeboten.
                        </p>
                        <Link href="/marketplace/create">
                          <Button>
                            Erstes Angebot erstellen
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Saved Listings Tab */}
                  <TabsContent value="saved">
                    <h2 className="text-xl font-semibold mb-6">Gespeicherte Angebote</h2>
                    
                    {userData.savedListings.length > 0 ? (
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {userData.savedListings.map(listing => (
                          <Card key={listing.id} className="overflow-hidden">
                            <div className="relative h-48">
                              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">Bild</span>
                              </div>
                              {listing.image && (
                                <Image
                                  src={listing.image}
                                  alt={listing.title}
                                  fill
                                  className="object-cover"
                                />
                              )}
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="absolute top-2 right-2 bg-white rounded-full"
                              >
                                <Heart className="h-4 w-4 text-red-500" fill="currentColor" />
                              </Button>
                            </div>
                            
                            <CardContent className="pt-4">
                              <Link href={`/marketplace/listings/${listing.id}`}>
                                <h3 className="font-semibold hover:underline">{listing.title}</h3>
                              </Link>
                              <div className="mt-1 font-bold text-green-700">
                                {listing.price.toFixed(2)} €/{listing.unit}
                              </div>
                              <div className="mt-2 flex justify-between items-center text-sm">
                                <div className="text-gray-600">
                                  {listing.seller}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {listing.location}
                                </div>
                              </div>
                            </CardContent>
                            
                            <CardFooter className="pt-0 flex justify-between">
                              <div className="text-sm text-gray-500">
                                {formatDate(listing.createdAt)}
                              </div>
                              <Link href={`/marketplace/listings/${listing.id}`}>
                                <Button variant="link" className="p-0 h-auto text-green-700">
                                  Details
                                </Button>
                              </Link>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine gespeicherten Angebote</h3>
                        <p className="text-gray-600 mb-6">
                          Sie haben noch keine Angebote gespeichert.
                        </p>
                        <Link href="/marketplace">
                          <Button>
                            Zum Marktplatz
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* About Me Tab */}
                  <TabsContent value="about">
                    <Card>
                      <CardHeader>
                        <CardTitle>Über mich</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userData.bio ? (
                          <div className="prose max-w-none">
                            <p>{userData.bio}</p>
                          </div>
                        ) : (
                          <p className="text-gray-600">
                            Keine Bio-Information vorhanden. Fügen Sie eine Beschreibung hinzu, 
                            um anderen Nutzern mehr über sich zu erzählen.
                          </p>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Link href="/profile/edit">
                          <Button variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Bearbeiten
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 