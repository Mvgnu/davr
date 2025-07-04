'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  MapPin, Phone, Mail, Globe, Star, Clock, 
  Info, Award, FileCheck, Edit, Trash2, AlertTriangle, 
  ChevronLeft, Leaf, Shield, Check, X, ExternalLink,
  Calendar, DollarSign, Users, Flag, Bookmark, Activity, BarChart2, MessageCircle,
  Navigation, Share2, CreditCard, Truck, Download, Upload, Gift, ShoppingBag, Map,
  Maximize2, Share, Facebook, Twitter, Car, Bike, Droplet, Wind, Zap, CloudRain,
  Copy, MessageSquare, AlertCircle, Loader, CheckCircle, Package, User, PieChart,
  Bus, Train, ShoppingCart, BarChart2 as ChartBar, ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ClaimRecyclingCenterForm from './ClaimRecyclingCenterForm';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from './DeleteConfirmationModal';

type Location = {
  city: string;
  zipCode: string;
  state: string;
  latitude?: number;
  longitude?: number;
};

type MaterialOffer = {
  id: number;
  materialId: number;
  materialName: string;
  category: string;
  price: number;
  minQuantity: number;
  notes?: string;
  active: boolean;
};

type BuyingMaterial = {
  materialId: number;
  materialName: string;
  category?: string;
  price: number;
  minQuantity: number;
  conditions?: string;
};

type Review = {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
};

type TransportOption = {
  type: 'bus' | 'train' | 'car' | 'bicycle';
  name: string;
  description: string;
};

type Statistics = {
  monthlyVolume?: string;
  materialDistribution?: Record<string, number>;
  environmentalImpact?: {
    co2Saved: string;
    waterSaved: string;
    energySaved: string;
  };
  visitors?: {
    daily: number;
    weekly: number;
    monthly: number;
    avgStayTime: string;
    busiestTime?: string;
    quietestTime?: string;
    avgWaitTime?: string;
  };
};

export type RecyclingCenterDetailType = {
  id: number;
  name: string;
  slug: string;
  address?: string;
  location?: Location;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  images?: string[];
  openingHours?: {
    [key: string]: string;
  };
  openNow?: boolean;
  materialOffers?: MaterialOffer[];
  buyingMaterials?: BuyingMaterial[];
  facilities?: string[];
  certifications?: string[];
  rating?: {
    average: number;
    count: number;
  };
  reviews?: Review[];
  transportOptions?: TransportOption[];
  statistics?: Statistics;
  isClaimed?: boolean;
  isVerified?: boolean;
  
  // Auth-related properties
  isAuthenticated?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
};

type RecyclingCenterDetailContentProps = {
  recyclingCenter: RecyclingCenterDetailType;
  city: string;
  slug: string;
  cityName?: string;
};

const RecyclingCenterDetailContent = ({
  recyclingCenter,
  city,
  slug,
  cityName = city,
}: RecyclingCenterDetailContentProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('about');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!recyclingCenter) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Recyclingcenter nicht gefunden</h2>
        <p className="text-gray-600">Das gewünschte Recyclingcenter konnte nicht gefunden werden.</p>
        <Link 
          href={`/recycling-centers/${city}`}
          className="mt-6 inline-flex items-center text-green-600 hover:text-green-800 font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Zurück zu Recyclingcentern in {cityName}
        </Link>
      </div>
    );
  }

  // Prepare materials data for display from materialOffers
  const materials = recyclingCenter.materialOffers?.map(offer => ({
    id: offer.id,
    name: offer.materialName,
    category: offer.category,
    accepted: offer.active,
    conditions: offer.notes || '', // Default to empty string if undefined
    price: offer.price || 0 // Default to 0 if undefined
  })) || [];

  // Prepare buying materials for display
  const buyingMaterials = recyclingCenter.buyingMaterials ? 
    recyclingCenter.buyingMaterials.map(material => ({
      id: material.materialId,
      name: material.materialName,
      category: material.category || 'Sonstige', // Default category if not provided
      minQuantity: material.minQuantity || 1,
      conditions: material.conditions || '',
      price: material.price || 0
    })) : [];

  // Handle image viewer
  const openImageViewer = (imageSrc: string) => {
    setSelectedImage(imageSrc);
  };

  // Share recycling center
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${recyclingCenter.name} | Recyclingcenter in ${cityName}`,
        text: `Entdecke ${recyclingCenter.name} in ${cityName}. Informationen über akzeptierte Materialien und mehr.`,
        url: window.location.href,
      }).catch((error) => {
        console.log('Error sharing', error);
        setIsShareModalOpen(true);
      });
    } else {
      setIsShareModalOpen(true);
    }
  };

  // Handle opening Google Maps directions
  const handleOpenDirections = () => {
    if (recyclingCenter.location?.latitude && recyclingCenter.location?.longitude) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${recyclingCenter.location.latitude},${recyclingCenter.location.longitude}`;
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Keine Koordinaten für diesen Recyclinghof verfügbar');
    }
  };

  // Handle share location via Web Share API
  const handleShareMapLocation = () => {
    if (navigator.share && recyclingCenter.location?.latitude && recyclingCenter.location?.longitude) {
      navigator.share({
        title: `${recyclingCenter.name} - Standort`,
        text: `Hier ist der Standort von ${recyclingCenter.name}`,
        url: `https://www.google.com/maps?q=${recyclingCenter.location.latitude},${recyclingCenter.location.longitude}`
      }).catch(error => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      toast.error('Teilen wird in diesem Browser nicht unterstützt');
    }
  };
  
  // Handler functions for user actions
  const handleClaimBusiness = async () => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push(`/auth/login?returnUrl=/recycling-centers/${city}/${slug}`);
      return;
    }
    setIsClaimModalOpen(true);
  };

  const handleEditCenter = () => {
    router.push(`/recycling-centers/${city}/${slug}/edit`);
  };

  const handleReportIssue = () => {
    setIsReportModalOpen(true);
  };
  
  const handleLeaveReview = () => {
    setIsReviewModalOpen(true);
  };

  const handleDeleteCenter = async () => {
    setIsConfirmDeleteOpen(true);
  };
  
  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Admin/Owner Action Bar - Only visible for owners/admins */}
        {(recyclingCenter.isOwner || recyclingCenter.isAdmin) && (
          <div className="bg-blue-50 px-6 py-3 flex items-center justify-between border-b border-blue-100">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">
                {recyclingCenter.isOwner ? 'Sie verwalten dieses Recyclingcenter' : 'Admin-Ansicht'}
              </span>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleEditCenter}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-1" />
                <span>Bearbeiten</span>
              </button>
              {recyclingCenter.isAdmin && (
                <button 
                  onClick={handleDeleteCenter}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span>Löschen</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Claim Business Bar - Visible for all if unclaimed, redirect to login if needed */}
        {(!recyclingCenter.isClaimed) && (
          <div className="bg-yellow-50 px-6 py-3 flex items-center justify-between border-b border-yellow-100">
            <div className="flex items-center">
              <Flag className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">
                Ist das Ihr Recyclingcenter?
              </span>
            </div>
            <button 
              onClick={handleClaimBusiness}
              className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              <Bookmark className="w-4 h-4 mr-1" />
              <span>Recyclingcenter beanspruchen</span>
            </button>
          </div>
        )}

        {/* Enhanced Header with hero image and gradient overlay */}
        <div className="relative h-60 sm:h-72 md:h-80 bg-gradient-to-r from-green-700 to-green-500">
          {recyclingCenter.images && recyclingCenter.images.length > 0 ? (
            <Image 
              src={recyclingCenter.images[0]} 
              alt={recyclingCenter.name}
              fill
              className="object-cover"
              priority
              onClick={() => openImageViewer(recyclingCenter.images![0])}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-green-800 to-green-600 opacity-90">
              <div className="absolute inset-0 opacity-10 bg-pattern-recycling"></div>
            </div>
          )}
          
          {/* Enhanced gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {/* Quick action buttons in top right */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button 
                onClick={handleShare}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-all"
                aria-label="Teilen"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button 
                onClick={handleOpenDirections}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-all"
                aria-label="Route planen"
              >
                <Navigation className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">{recyclingCenter.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center text-gray-100 gap-y-2 sm:gap-x-6">
                <p className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  {recyclingCenter.address || "Standort nicht angegeben"}, {recyclingCenter.location?.city || cityName}
                </p>
                {recyclingCenter.openNow && (
                  <p className="flex items-center text-green-300">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Jetzt geöffnet</span>
                  </p>
                )}
                {recyclingCenter.rating && (
                  <p className="flex items-center">
                    <Star className="w-4 h-4 mr-2 flex-shrink-0 text-yellow-400" />
                    <span>{recyclingCenter.rating.average.toFixed(1)} ({recyclingCenter.rating.count})</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Rating and badges */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap justify-between items-center px-6 py-3">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              {recyclingCenter.isVerified && (
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                  <Award className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium text-blue-700">Verifiziert</span>
                </div>
              )}
              
              {recyclingCenter.certifications && recyclingCenter.certifications.length > 0 && (
                <div className="flex items-center bg-purple-50 px-3 py-1 rounded-full">
                  <FileCheck className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm font-medium text-purple-700">Zertifiziert</span>
                </div>
              )}
              
              {recyclingCenter.buyingMaterials && recyclingCenter.buyingMaterials.length > 0 && (
                <div className="flex items-center bg-emerald-50 px-3 py-1 rounded-full">
                  <DollarSign className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm font-medium text-emerald-700">Kauft Materialien</span>
                </div>
              )}
            </div>

            {/* User action buttons */}
            <div className="flex mt-2 sm:mt-0">
              {!recyclingCenter.isOwner && recyclingCenter.isAuthenticated && (
                <button 
                  onClick={handleReportIssue}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mr-4"
                >
                  <Flag className="w-4 h-4 mr-1" />
                  <span>Problem melden</span>
                </button>
              )}
              {!recyclingCenter.isAuthenticated && (
                <Link
                  href={`/auth/login?returnUrl=/recycling-centers/${city}/${slug}`}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <Users className="w-4 h-4 mr-1" />
                  <span>Anmelden für mehr Funktionen</span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Enhanced Navigation tabs */}
          <div className="flex px-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <button 
              className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'about' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('about')}
            >
              Über
            </button>
            <button 
              className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'materials' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('materials')}
            >
              Annahme-Materialien
            </button>
            {buyingMaterials.length > 0 && (
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'buying' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('buying')}
              >
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Ankauf-Materialien
                </span>
              </button>
            )}
            <button 
              className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'reviews' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('reviews')}
            >
              Bewertungen
            </button>
            <button 
              className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'map' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('map')}
            >
              <span className="flex items-center">
                <Map className="w-4 h-4 mr-1" />
                Karte
              </span>
            </button>
            {recyclingCenter.statistics && (
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'statistics' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('statistics')}
              >
                <span className="flex items-center">
                  <ChartBar className="w-4 h-4 mr-1" />
                  Statistiken
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="p-6">
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {/* Description Section - Enhanced with fallback and styling */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Info className="w-4 h-4 mr-2 text-gray-500" />
                      Über dieses Recyclingcenter
                    </h3>
                  </div>
                  <div className="p-4">
                    {recyclingCenter.description ? (
                      <p className="text-gray-600 whitespace-pre-line">
                        {recyclingCenter.description}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-600">
                          Bei {recyclingCenter.name} handelt es sich um einen modernen Recyclinghof in {recyclingCenter.location?.city || cityName}. Hier können Sie verschiedene Materialien entsorgen und zum Recycling abgeben.
                        </p>
                        <p className="text-gray-600">
                          Recyclinghöfe spielen eine entscheidende Rolle in Deutschlands Kreislaufwirtschaft. Durch die fachgerechte Trennung und Verwertung von Wertstoffen werden wertvolle Ressourcen geschont und die Umweltbelastung reduziert.
                        </p>
                        {recyclingCenter.isOwner && (
                          <div className="bg-blue-50 p-3 rounded-md text-sm">
                            <p className="text-blue-700 flex items-center">
                              <Info className="w-4 h-4 mr-2 text-blue-500" />
                              Als Verwalter können Sie hier eine detaillierte Beschreibung hinzufügen, um potenzielle Kunden besser zu informieren.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Operating Hours - Enhanced with fallback and better styling */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      Öffnungszeiten
                    </h3>
                  </div>
                  <div className="p-4">
                    {recyclingCenter.openingHours && Object.keys(recyclingCenter.openingHours).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(recyclingCenter.openingHours).map(([day, hours]) => (
                          <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="font-medium text-gray-700">{day}</span>
                            <span className="text-gray-600">{hours}</span>
                          </div>
                        ))}
                        {recyclingCenter.openNow && (
                          <div className="col-span-full mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                              Jetzt geöffnet
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-600">Die Öffnungszeiten wurden noch nicht hinterlegt.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-gray-600">
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-500">Montag - Freitag</span>
                            <span className="text-gray-400">Keine Angabe</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-500">Samstag</span>
                            <span className="text-gray-400">Keine Angabe</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-500">Sonntag</span>
                            <span className="text-gray-400">Geschlossen</span>
                          </div>
                        </div>
                        {recyclingCenter.isOwner && (
                          <div className="bg-blue-50 p-3 rounded-md text-sm">
                            <p className="text-blue-700 flex items-center">
                              <Info className="w-4 h-4 mr-2 text-blue-500" />
                              Bitte hinterlegen Sie die aktuellen Öffnungszeiten für Ihre Kunden.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accepted Materials Summary */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <RecycleIcon className="w-4 h-4 mr-2 text-gray-500" />
                      Angenommene Materialien
                    </h3>
                  </div>
                  <div className="p-4">
                    {materials && materials.length > 0 ? (
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          {materials.filter(m => m.accepted).slice(0, 8).map((material, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                              {material.name}
                            </span>
                          ))}
                          {materials.filter(m => m.accepted).length > 8 && (
                            <button 
                              onClick={() => setActiveTab('materials')}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              +{materials.filter(m => m.accepted).length - 8} weitere
                            </button>
                          )}
                        </div>
                        <button 
                          onClick={() => setActiveTab('materials')}
                          className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center"
                        >
                          Alle angenommenen Materialien anzeigen
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-gray-600">Keine Informationen zu angenommenen Materialien vorhanden.</p>
                        <button 
                          onClick={() => setActiveTab('materials')}
                          className="mt-2 text-sm text-green-600 font-medium hover:text-green-700"
                        >
                          Zum Materialien-Tab
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Facilities and Services with enhanced styling */}
                {recyclingCenter.facilities && recyclingCenter.facilities.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <Package className="w-4 h-4 mr-2 text-gray-500" />
                        Annehmlichkeiten vor Ort
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {recyclingCenter.facilities.map((facility, index) => (
                          <div key={index} className="flex items-center bg-gray-50 p-2 rounded-md">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Environmental Impact - New Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <Leaf className="w-4 h-4 mr-2 text-gray-500" />
                      Umweltbeitrag
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <p>
                        Durch die Nutzung von Recyclinghöfen wie {recyclingCenter.name} tragen Sie aktiv zum Umweltschutz bei:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                              <Droplet className="w-4 h-4 text-green-600" />
                            </div>
                            <h4 className="font-medium text-green-800">Ressourcenschonung</h4>
                          </div>
                          <p className="text-sm text-green-700">
                            Durch das Recycling werden wertvolle Rohstoffe zurückgewonnen und können erneut genutzt werden.
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                              <Wind className="w-4 h-4 text-blue-600" />
                            </div>
                            <h4 className="font-medium text-blue-800">CO₂-Reduktion</h4>
                          </div>
                          <p className="text-sm text-blue-700">
                            Recycling benötigt weniger Energie als die Neuproduktion und spart so CO₂-Emissionen ein.
                          </p>
                        </div>
                      </div>
                      {recyclingCenter.statistics?.environmentalImpact && (
                        <button 
                          onClick={() => setActiveTab('statistics')}
                          className="mt-3 text-sm text-green-600 font-medium hover:text-green-700 flex items-center"
                        >
                          Detaillierte Umweltstatistiken anzeigen
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Images Gallery with enhanced styling */}
                {recyclingCenter.images && recyclingCenter.images.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <ImageIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Impressionen
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {recyclingCenter.images.map((image, index) => (
                          <div 
                            key={index} 
                            className="relative aspect-video rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
                            onClick={() => openImageViewer(image)}
                          >
                            <Image 
                              src={image} 
                              alt={`${recyclingCenter.name} - Bild ${index + 1}`} 
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                              <div className="bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                                <Maximize2 className="w-4 h-4 text-gray-700" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Certifications with enhanced styling */}
                {recyclingCenter.certifications && recyclingCenter.certifications.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-gray-500" />
                        Zertifizierungen
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {recyclingCenter.certifications.map((cert, index) => (
                          <div key={index} className="bg-purple-50 px-3 py-1.5 rounded-md border border-purple-100">
                            <span className="text-sm font-medium text-purple-700 flex items-center">
                              <Shield className="w-3 h-3 mr-1.5" />
                              {cert}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-1 space-y-6">
                {/* Contact Info Card - Enhanced with styling and fallbacks */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
                  <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                    <h3 className="font-medium text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      Kontaktinformationen
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {recyclingCenter.address && (
                      <div className="flex">
                        <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-gray-800">{recyclingCenter.address}</p>
                          <p className="text-gray-600">{recyclingCenter.location?.city || cityName}, {recyclingCenter.location?.zipCode || ''}</p>
                        </div>
                      </div>
                    )}
                    
                    {recyclingCenter.phone ? (
                      <div className="flex">
                        <Phone className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <a href={`tel:${recyclingCenter.phone}`} className="text-blue-600 hover:underline">
                          {recyclingCenter.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="flex text-gray-400">
                        <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span>Keine Telefonnummer angegeben</span>
                      </div>
                    )}
                    
                    {recyclingCenter.email ? (
                      <div className="flex">
                        <Mail className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <a href={`mailto:${recyclingCenter.email}`} className="text-blue-600 hover:underline">
                          {recyclingCenter.email}
                        </a>
                      </div>
                    ) : (
                      <div className="flex text-gray-400">
                        <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span>Keine E-Mail-Adresse angegeben</span>
                      </div>
                    )}
                    
                    {recyclingCenter.website ? (
                      <div className="flex">
                        <Globe className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <a 
                          href={recyclingCenter.website.startsWith('http') ? recyclingCenter.website : `https://${recyclingCenter.website}`} 
                          className="text-blue-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {recyclingCenter.website}
                          <ExternalLink className="w-3 h-3 ml-1 inline" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex text-gray-400">
                        <Globe className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span>Keine Website angegeben</span>
                      </div>
                    )}

                    <div className="pt-3 grid grid-cols-1 gap-2">
                      <button 
                        onClick={handleOpenDirections}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md flex items-center justify-center transition-colors"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Route planen
                      </button>
                      
                      <button 
                        onClick={handleShare}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md flex items-center justify-center border border-gray-200 transition-colors"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Recyclinghof teilen
                      </button>
                    </div>
                  </div>
                </div>

                {/* Small Map Preview - Enhanced with styling */}
                {recyclingCenter.location && recyclingCenter.location.latitude && recyclingCenter.location.longitude && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        Standort
                      </h3>
                      <button 
                        onClick={() => setActiveTab('map')}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        Große Karte
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                    <div className="h-48 relative" onClick={() => setActiveTab('map')}>
                      <div className="absolute inset-0">
                        <iframe 
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${recyclingCenter.location.longitude-0.01}%2C${recyclingCenter.location.latitude-0.01}%2C${recyclingCenter.location.longitude+0.01}%2C${recyclingCenter.location.latitude+0.01}&layer=mapnik&marker=${recyclingCenter.location.latitude}%2C${recyclingCenter.location.longitude}`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          className="border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`${recyclingCenter.name} Standort`}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center transition-all cursor-pointer">
                        <div className="bg-white rounded-full p-2 shadow-md opacity-0 hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick info card for ratings - New Section */}
                {recyclingCenter.rating && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-gray-500" />
                        Bewertungen
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-center">
                        <div className="text-3xl font-bold text-gray-800 mr-3">
                          {recyclingCenter.rating?.average.toFixed(1)}
                        </div>
                        <div>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-5 h-5 ${i < Math.round(recyclingCenter.rating?.average || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {recyclingCenter.rating?.count} Bewertungen
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('reviews')}
                        className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center"
                      >
                        Alle Bewertungen anzeigen
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Materials purchase info - New Section */}
                {buyingMaterials && buyingMaterials.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-medium text-gray-700 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                        Materialankauf
                      </h3>
                      <button 
                        onClick={() => setActiveTab('buying')}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        Alle Details
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        Dieser Recyclinghof kauft folgende Materialien an:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {buyingMaterials.slice(0, 4).map((material, index) => (
                          <div key={index} className="bg-green-50 p-2 rounded-md text-xs border border-green-100">
                            <span className="font-medium text-green-700">{material.name}</span>
                            <div className="text-green-600 mt-1">
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(material.price)}/kg
                            </div>
                          </div>
                        ))}
                        {buyingMaterials.length > 4 && (
                          <button 
                            onClick={() => setActiveTab('buying')}
                            className="bg-gray-50 p-2 rounded-md text-xs border border-gray-200 hover:bg-gray-100"
                          >
                            +{buyingMaterials.length - 4} weitere anzeigen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Angenommene Materialien</h2>
              
              {materials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {materials.map((material, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
                        <h3 className="font-medium text-gray-800">{material.name}</h3>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center mb-2">
                          <Check className="w-5 h-5 text-green-500 mr-2" />
                          <span className="text-gray-700">{material.accepted ? 'Wird angenommen' : 'Wird nicht angenommen'}</span>
                        </div>
                        
                        {material.conditions && (
                          <div className="mt-3 flex items-center text-sm text-gray-700">
                            <span>Bedingungen: {material.conditions}</span>
                          </div>
                        )}
                        
                        {material.price && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Kosten:</span>
                            <span className="font-medium text-gray-800">{material.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Keine Materialien gefunden</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Für dieses Recyclingcenter wurden noch keine Informationen zu angenommenen Materialien hinterlegt.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'buying' && (
            <div className="space-y-6">
              {buyingMaterials && buyingMaterials.length > 0 ? (
                <>
                  <h3 className="text-lg font-medium">Materialankauf Details</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Dieser Recyclinghof kauft die folgenden Materialien zu den angegebenen Bedingungen an.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {buyingMaterials.map((material) => (
                      <div key={material.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col">
                        <div className="flex items-center mb-2">
                          <span className="text-lg font-medium">{material.name}</span>
                          <span className="ml-auto bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(material.price)} / kg
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p className="mb-1"><strong>Mindestmenge:</strong> {material.minQuantity || 1} kg</p>
                          {material.conditions && (
                            <p className="mb-1"><strong>Bedingungen:</strong> {material.conditions}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Kein Materialankauf</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Dieser Recyclinghof bietet aktuell keinen Materialankauf an. Bitte kontaktieren Sie den Hof direkt für weitere Informationen.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Bewertungen und Erfahrungen</h2>
                {recyclingCenter.isAuthenticated && !recyclingCenter.isOwner && (
                  <button 
                    onClick={handleLeaveReview}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    <span>Bewertung abgeben</span>
                  </button>
                )}
              </div>
              
              {recyclingCenter.reviews && recyclingCenter.reviews.length > 0 ? (
                <div className="space-y-4">
                  {recyclingCenter.reviews.map((review, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{review.userName || 'Anonymer Nutzer'}</h3>
                            <p className="text-xs text-gray-500">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                      
                      {review.reply && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Antwort vom Betreiber:</p>
                          <p className="text-sm text-gray-600">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Noch keine Bewertungen</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Dieses Recyclingcenter wurde noch nicht bewertet. Seien Sie der Erste, der eine Bewertung abgibt!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Karte</h3>
              
              {/* OpenStreetMap full size */}
              <div className="h-96 w-full rounded-lg overflow-hidden relative border border-gray-200 dark:border-gray-700">
                {recyclingCenter.location?.latitude && recyclingCenter.location?.longitude ? (
                  <iframe 
                    title="Recycling Center Map"
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${recyclingCenter.location.longitude-0.01}%2C${recyclingCenter.location.latitude-0.01}%2C${recyclingCenter.location.longitude+0.01}%2C${recyclingCenter.location.latitude+0.01}&layer=mapnik&marker=${recyclingCenter.location.latitude}%2C${recyclingCenter.location.longitude}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                    <p>Keine Karteninformationen verfügbar</p>
                  </div>
                )}
              </div>
              
              {/* Map Action Buttons */}
              <div className="flex gap-4 mt-2">
                <Button onClick={handleOpenDirections} className="flex-1">
                  <MapPin className="h-4 w-4 mr-2" />
                  Route planen
                </Button>
                <Button onClick={handleShareMapLocation} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Standort teilen
                </Button>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Öffentliche Verkehrsmittel</h4>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {recyclingCenter.transportOptions && recyclingCenter.transportOptions.length > 0 ? (
                    <div className="space-y-3">
                      {recyclingCenter.transportOptions.map((option, index) => (
                        <div key={index} className="flex items-start">
                          {option.type === 'bus' && <Bus className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />}
                          {option.type === 'train' && <Train className="h-5 w-5 mr-3 text-red-500 mt-0.5" />}
                          <div>
                            <p className="font-medium">{option.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">Keine Informationen zu öffentlichen Verkehrsmitteln verfügbar.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'statistics' && recyclingCenter.statistics && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Recycling-Statistiken</h3>
              
              {recyclingCenter.statistics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly Recycling Volume */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Monatliches Recyclingvolumen</h4>
                    <div className="h-52 flex items-center justify-center">
                      {/* Placeholder for chart component */}
                      <div className="text-center">
                        <PieChart className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                        <p>Chart Component</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Material Distribution */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Materialverteilung</h4>
                    <div className="h-52 flex items-center justify-center">
                      {/* Placeholder for chart component */}
                      <div className="text-center">
                        <PieChart className="h-10 w-10 mx-auto text-green-500 mb-2" />
                        <p>Chart Component</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Environmental Impact */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Umweltauswirkungen</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">CO₂-Einsparung</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-sm font-medium">{recyclingCenter.statistics.environmentalImpact?.co2Saved} t</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Wassereinsparung</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <span className="text-sm font-medium">{recyclingCenter.statistics.environmentalImpact?.waterSaved} m³</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Energieeinsparung</p>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                            <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                          <span className="text-sm font-medium">{recyclingCenter.statistics.environmentalImpact?.energySaved} kWh</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visitor Statistics */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Besucherstatistiken</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Tägliche Besucher</span>
                        <span className="font-medium">{recyclingCenter.statistics.visitors?.daily}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Wöchentliche Besucher</span>
                        <span className="font-medium">{recyclingCenter.statistics.visitors?.weekly}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Monatliche Besucher</span>
                        <span className="font-medium">{recyclingCenter.statistics.visitors?.monthly}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Durchschnittliche Verweildauer</span>
                        <span className="font-medium">{recyclingCenter.statistics.visitors?.avgStayTime} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <ChartBar className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Keine Statistiken verfügbar</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Für diesen Recyclinghof sind derzeit keine Statistiken verfügbar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
      {isClaimModalOpen && (
        <Modal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          title="Recyclingcenter beanspruchen"
          size="lg"
        >
          <ClaimRecyclingCenterForm
            recyclingCenterId={recyclingCenter.id}
            recyclingCenterName={recyclingCenter.name}
            onSuccess={() => {
              setIsClaimModalOpen(false);
              toast.success('Ihre Anfrage wurde erfolgreich eingereicht');
              // Wait briefly before refreshing
              setTimeout(() => {
                router.refresh();
              }, 1000);
            }}
            onClose={() => setIsClaimModalOpen(false)}
          />
        </Modal>
      )}
      
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Recyclingcenter bearbeiten</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p>Edit form would go here...</p>
            </div>
          </div>
        </div>
      )}
      
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Problem melden</h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p>Report issue form would go here...</p>
            </div>
          </div>
        </div>
      )}
      
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Bewertung abgeben</h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p>Review form would go here...</p>
            </div>
          </div>
        </div>
      )}
      
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Teilen</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Teilen Sie dieses Recyclingcenter mit anderen:
              </p>
              <div className="grid grid-cols-4 gap-4">
                <button className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Facebook className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600">Facebook</span>
                </button>
                <button className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Twitter className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600">Twitter</span>
                </button>
                <button className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600">WhatsApp</span>
                </button>
                <button className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-600">E-Mail</span>
                </button>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Link kopieren:</p>
                <div className="flex">
                  <input 
                    type="text" 
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm"
                  />
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300 border-l-0 rounded-r-md px-3 py-2"
                    onClick={() => {
                      if (typeof navigator !== 'undefined') {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link kopiert!');
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <DeleteConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        recyclingCenterId={recyclingCenter.id}
        recyclingCenterName={recyclingCenter.name}
        redirectUrl={`/recycling-centers/${city}`}
      />

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <Image 
              src={selectedImage} 
              alt="Enlarged view"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default RecyclingCenterDetailContent;

// Helper component for material icons
const RecycleIcon = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
    <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
    <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
  </svg>
); 