'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, MapPin, Phone, Building, ArrowLeft, Save, AlertCircle, AlertTriangle, Settings, Package, Star, ShoppingBag, Heart, LogOut, Edit, Camera, Loader2, ListX, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { deleteUserProfile, updateUserProfile } from '@/lib/api/user';
import DeleteAccountModal from './DeleteAccountModal';
import ListingCard from '@/components/marketplace/ListingCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// Define types for MarketplaceListing based on ListingCard and API needs
// Ensure this matches the type expected by ListingCard
type ListingCardData = {
  id: string;
  title: string;
  image_url?: string | null;
  location?: string | null;
  quantity?: number | null;
  unit?: string | null;
  material?: { name: string } | null;
  created_at: string; // Assuming ListingCard uses string date
  seller: { id: string; name: string | null };
  status?: string;
  type?: string; // Add type if ListingCard uses it
  slug?: string; // Add slug if ListingCard links to detail page
};

type UserListing = {
  id: string;
  title: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  location?: string | null;
  created_at: string; 
  image_url?: string | null;
  status?: string;
  material?: { name: string } | null;
  seller: { id: string; name: string | null };
};

// Define the UserProfileData type based on getUserProfile return value
interface UserProfileData {
  id: string;
  name: string;
  email: string;
  username: string; // Using name as username
  role: string;
  isPremium: boolean;
  accountType: string;
  profile: {
    bio: string;
    location: string;
    website: string;
    avatar: string;
  };
  createdAt: string | Date; // Type from DB can be string or Date
  updatedAt: string | Date; // Type from DB can be string or Date
  formattedCreatedAt: string; // Added in page.tsx
  bio: string;
  location: string;
  website: string;
  avatar: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  image?: string;
  listings: UserListing[]; // Assuming listings are fetched separately
  savedListings: UserListing[];
  isVerified: boolean;
}

interface ProfileContentProps {
  userData: UserProfileData; // Use the specific type
  listings: UserListing[];
  listingsError?: string | null;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ userData, listings, listingsError }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: userData.name || '',
    email: userData.email || '',
    phone: userData.phone || '',
    address: userData.address || '',
    city: userData.city || '',
    zipCode: userData.zipCode || '',
    bio: userData.bio || '',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    
    try {
      const result = await updateUserProfile(profileData);
      if (result.success) {
        toast.success('Profil erfolgreich aktualisiert');
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.message || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };
  
  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteAccount = async () => {
    try {
      const result = await deleteUserProfile();
      if (result.success) {
        toast.success('Konto erfolgreich gelöscht');
        await signOut({ redirect: true, callbackUrl: '/' });
      } else {
        setError(result.message || 'Fehler beim Löschen des Kontos');
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setIsDeleteModalOpen(false);
    }
  };
  
  return (
    <>
      <div className="flex flex-col lg:flex-row items-start gap-8 md:gap-12">
        <div 
          className="w-full lg:w-1/3 lg:sticky lg:top-24 animate-fade-in-up opacity-0 [--animation-delay:100ms]"
          style={{ animationFillMode: 'forwards' }}
        >
          <Card className="overflow-hidden border-border/80 shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4 group">
                  <Avatar className="w-28 h-28 border-2 border-border group-hover:border-primary transition-colors duration-200">
                    <AvatarImage 
                      src={userData.image || '/images/placeholder/avatar.jpg'} 
                      alt={userData.name || 'User avatar'} 
                    />
                    <AvatarFallback className="text-3xl">{(userData.name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute -bottom-2 -right-2 rounded-full bg-background h-8 w-8 border-border group-hover:border-primary group-hover:text-primary transition-all duration-200"
                    onClick={() => toast.error('Avatar-Upload noch nicht implementiert')}
                    aria-label="Profilbild ändern"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <h1 className="text-2xl font-semibold text-foreground">{userData.name || 'Unbekannter Nutzer'}</h1>
                 {userData.isVerified && (
                  <Badge variant="default" className="mt-1.5 bg-green-600 hover:bg-green-700 text-white">
                     Verifizierter Benutzer
                  </Badge>
                 )}
                
                 <div className="text-sm text-muted-foreground mt-3 space-y-1">
                    <div className="flex items-center justify-center">
                      <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      {userData.city || 'Kein Standort angegeben'}
                    </div>
                    <p>
                      Mitglied seit {userData.formattedCreatedAt}
                    </p>
                 </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  variant={isEditing ? "secondary" : "default"}
                  className="w-full justify-start"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isEditing ? 'Bearbeitung abbrechen' : 'Profil bearbeiten'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteAccount}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Konto löschen
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6 border-border/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                 <Mail className="w-5 h-5 mr-2 text-accent"/> Kontaktinformationen
               </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                 <div className="flex items-center">
                   <span className="w-16 font-medium text-muted-foreground">E-Mail</span>
                   <span className="text-foreground">{userData.email || '-'}</span>
                 </div>
                 <div className="flex items-center">
                   <span className="w-16 font-medium text-muted-foreground">Telefon</span>
                   <span className="text-foreground">{profileData.phone || '-'}</span>
                 </div>
                 <div className="flex items-start">
                   <span className="w-16 font-medium text-muted-foreground flex-shrink-0">Adresse</span>
                   <span className="text-foreground">
                       {profileData.address || profileData.city || profileData.zipCode ? 
                           `${profileData.address || ''}${profileData.address && (profileData.city || profileData.zipCode) ? ', ' : ''}${profileData.zipCode || ''} ${profileData.city || ''}` 
                           : '-'}
                   </span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div 
          className="w-full lg:w-2/3 animate-fade-in-up opacity-0 [--animation-delay:200ms]"
          style={{ animationFillMode: 'forwards' }}
        >
          {isEditing ? (
            <Card className="border-border/80 shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Profil bearbeiten</CardTitle>
                <CardDescription>Aktualisieren Sie hier Ihre persönlichen Daten.</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md flex items-center text-sm">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={profileData.name}
                          onChange={handleInputChange}
                          required
                          className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profileData.email}
                          readOnly 
                          disabled 
                          className="bg-muted/50 cursor-not-allowed"
                        />
                         <p className="text-xs text-muted-foreground">E-Mail kann nicht geändert werden.</p>
                      </div>
                   </div>
                  
                   <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefon (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                        disabled={isSaving}
                        placeholder="Ihre Telefonnummer"
                      />
                   </div>
                  
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="address">Straße & Hausnr. (Optional)</Label>
                        <Input
                          id="address"
                          name="address"
                          type="text"
                          value={profileData.address}
                          onChange={handleInputChange}
                          className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                          disabled={isSaving}
                          placeholder="Ihre Adresse"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="zipCode">PLZ (Optional)</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          type="text"
                          value={profileData.zipCode}
                          onChange={handleInputChange}
                          className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                          disabled={isSaving}
                          placeholder="Postleitzahl"
                        />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <Label htmlFor="city">Stadt (Optional)</Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        value={profileData.city}
                        onChange={handleInputChange}
                        className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                        disabled={isSaving}
                        placeholder="Ihre Stadt"
                      />
                    </div>
                   
                   <div className="space-y-1.5">
                      <Label htmlFor="bio">Über mich (Optional)</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={handleInputChange}
                        className="transition-colors duration-200 focus:border-primary focus:ring-primary/20"
                        disabled={isSaving}
                        placeholder="Erzählen Sie etwas über sich..."
                      />
                   </div>
                   
                   <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                      >
                        Abbrechen
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSaving}
                      >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}
                      </Button>
                   </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
                <TabsTrigger value="info">
                  <User className="mr-2 h-4 w-4"/> Profil Info
                </TabsTrigger>
                <TabsTrigger value="listings">
                   <ShoppingBag className="mr-2 h-4 w-4"/> Meine Angebote
                </TabsTrigger>
                {/* Add other triggers like Reviews, Settings later */}
                <TabsTrigger value="settings" disabled>
                   <Settings className="mr-2 h-4 w-4"/> Einstellungen
                </TabsTrigger>
                 <TabsTrigger value="reviews" disabled>
                    <Star className="mr-2 h-4 w-4"/> Meine Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <Card className="border-border/80 shadow-md">
                  <CardHeader>
                     <CardTitle>Über Mich</CardTitle>
                  </CardHeader>
                   <CardContent className="text-sm text-muted-foreground">
                      {profileData.bio || 'Keine Biografie hinzugefügt.'}
                   </CardContent>
                </Card>
                {/* Add other profile info sections here if needed */}
              </TabsContent>

              <TabsContent value="listings">
                <Card className="border-border/80 shadow-md">
                   <CardHeader>
                     <CardTitle>Meine Marktplatzangebote</CardTitle>
                   </CardHeader>
                   <CardContent>
                      {listingsError && (
                        <div className="text-destructive text-center py-4">
                           <AlertTriangle className="mx-auto h-6 w-6 mb-2" />
                           Fehler beim Laden der Angebote: {listingsError}
                         </div>
                      )}
                      {!listingsError && listings.length === 0 && (
                         <div className="text-center py-10 text-muted-foreground">
                           <ListX className="mx-auto h-10 w-10 mb-3" />
                           <p>Sie haben noch keine Angebote erstellt.</p>
                           <Link href="/marketplace/new">
                              <Button size="sm" className="mt-4">
                                 <PlusCircle className="mr-2 h-4 w-4" /> Angebot erstellen
                              </Button>
                            </Link>
                         </div>
                      )}
                      {!listingsError && listings.length > 0 && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {listings.map((listing) => (
                             <ListingCard key={listing.id} listing={listing} />
                           ))}
                         </div>
                      )}
                   </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                {/* Settings content goes here */}
                 <p className="text-muted-foreground text-center py-10">Einstellungen folgen bald.</p>
              </TabsContent>
              <TabsContent value="reviews">
                {/* Reviews content goes here */}
                 <p className="text-muted-foreground text-center py-10">Ihre Reviews folgen bald.</p>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAccount}
      />
    </>
  );
};

export default ProfileContent;