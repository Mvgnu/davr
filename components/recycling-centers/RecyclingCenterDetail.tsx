import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useRecyclingCenters } from '@/lib/hooks/useRecyclingCenters';
import { useMaterialOffers } from '@/lib/hooks/useMaterialOffers';
import { RecyclingCenterDetail as RecyclingCenterDetailType } from '@/lib/api/recyclingCenters';
import { MapPin, Phone, Mail, Globe, Star, Clock, Info, Award, FileCheck, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface RecyclingCenterDetailProps {
  idOrSlug: string;
}

// Extend the RecyclingCenterDetailType to include additional properties we need
interface ExtendedRecyclingCenterDetailType extends RecyclingCenterDetailType {
  ownerName?: string;
  ownerEmail?: string;
  images?: string[];
  reviews?: Array<{
    id: number;
    author: string;
    rating: number;
    comment: string;
    date: string;
    ownerReply?: string;
  }>;
  openingHours?: Array<{
    day: string;
    open: string;
    close: string;
  }>;
}

const RecyclingCenterDetail: React.FC<RecyclingCenterDetailProps> = ({ idOrSlug }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [center, setCenter] = useState<ExtendedRecyclingCenterDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimReason, setClaimReason] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  
  const { fetchCenter, deleteCenter } = useRecyclingCenters();
  
  useEffect(() => {
    const loadCenter = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const centerData = await fetchCenter(idOrSlug);
        if (centerData) {
          setCenter(centerData as ExtendedRecyclingCenterDetailType);
        } else {
          setError('Recycling center not found');
        }
      } catch (err) {
        console.error('Error loading recycling center:', err);
        setError(typeof err === 'string' ? err : 'Failed to load recycling center details');
      } finally {
        setLoading(false);
      }
    };
    
    if (idOrSlug) {
      loadCenter();
    }
  }, [idOrSlug, fetchCenter]);
  
  const handleDelete = async () => {
    if (!center?.id) return;
    
    if (window.confirm('Are you sure you want to delete this recycling center? This action cannot be undone.')) {
      try {
        const success = await deleteCenter(Number(center.id));
        if (success) {
          router.push('/recycling-centers');
        } else {
          setError('Failed to delete recycling center');
        }
      } catch (err) {
        console.error('Error deleting recycling center:', err);
        setError(typeof err === 'string' ? err : 'Failed to delete recycling center');
      }
    }
  };
  
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!center?.id || !session?.user) {
      setError('You must be logged in to claim a recycling center');
      return;
    }
    
    setClaimLoading(true);
    
    try {
      const response = await fetch(`/api/recycling-centers/${center.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: claimReason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClaimSuccess(true);
        // Update the center data to reflect the claim
        setCenter({
          ...center,
          isOwner: true,
          ownerName: (session.user as any).name,
          ownerEmail: (session.user as any).email
        });
      } else {
        setError(data.error || 'Failed to claim recycling center');
      }
    } catch (err) {
      console.error('Error claiming recycling center:', err);
      setError(typeof err === 'string' ? err : 'Failed to claim recycling center');
    } finally {
      setClaimLoading(false);
    }
  };
  
  const formatOpeningHours = (hours: Array<{day: string, open: string, close: string}>) => {
    if (!hours || hours.length === 0) return 'Not specified';
    
    // Example formatting function - adjust according to your data structure
    return hours.map(hour => `${hour.day}: ${hour.open} - ${hour.close}`).join(', ');
  };
  
  if (loading) {
    return (
      <div className="w-full p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  if (error || !center) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-red-50 text-red-600 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Center</h2>
        <p className="text-gray-600">{error || 'Failed to load recycling center'}</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  const isOwnerOrAdmin = center.isOwner || (session?.user as any)?.role === 'admin';
  const canClaim = !center.isOwner && session?.user;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header with cover image */}
        <div className="relative h-48 bg-gradient-to-r from-green-500 to-green-700">
          {center.images && center.images.length > 0 ? (
            <Image 
              src={center.images[0]} 
              alt={center.name}
              fill
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl font-bold">{center.name}</h1>
              <p className="mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {center.address}, {center.location.city}
              </p>
            </div>
          </div>
        </div>
      
        {/* Rating and Badges */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap justify-between items-center px-6 py-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="font-semibold">{center.rating.average.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">({center.rating.count})</span>
              </div>
              
              {center.isVerified && (
                <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                  <Award className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-sm font-medium text-blue-700">Verified</span>
                </div>
              )}
            </div>
            
            {/* Ownership information */}
            <div className="mt-0">
              {center.ownerName ? (
                <div className="inline-flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  <span className="font-medium">Owned by:</span>
                  <span className="ml-1">{center.ownerName}</span>
                </div>
              ) : canClaim ? (
                <button
                  onClick={() => setClaimModalOpen(true)}
                  className="inline-flex items-center text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition duration-150"
                >
                  <FileCheck className="w-4 h-4 mr-1" />
                  Claim this recycling center
                </button>
              ) : (
                <div className="inline-flex items-center text-sm text-gray-600">
                  <span className="italic">Unclaimed listing</span>
                  {!session && (
                    <span className="ml-1 text-blue-600 hover:underline cursor-pointer" onClick={() => router.push('/auth/login')}>
                      Sign in to claim
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex px-6 border-b border-gray-200">
            <button 
              className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'about' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'materials' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('materials')}
            >
              Materials & Prices
            </button>
            <button
              className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'photos' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('photos')}
            >
              Photos
            </button>
            <button
              className={`py-3 px-4 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'about' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700">
                  {center.description || 'No description provided for this recycling center.'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Info className="w-5 h-5 text-green-600 mr-2" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {center.contact.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="w-4 h-4 text-gray-500 mr-3" />
                        <a href={`tel:${center.contact.phone}`} className="hover:text-green-600">{center.contact.phone}</a>
                      </div>
                    )}
                    {center.contact.email && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="w-4 h-4 text-gray-500 mr-3" />
                        <a href={`mailto:${center.contact.email}`} className="hover:text-green-600">{center.contact.email}</a>
                      </div>
                    )}
                    {center.contact.website && (
                      <div className="flex items-center text-gray-700">
                        <Globe className="w-4 h-4 text-gray-500 mr-3" />
                        <a href={center.contact.website} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 truncate">{center.contact.website}</a>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-5 h-5 text-green-600 mr-2" />
                    Opening Hours
                  </h3>
                  <div className="text-gray-700">
                    {center.openingHours && center.openingHours.length > 0 ? (
                      <div className="space-y-1">
                        {center.openingHours.map((hour, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="font-medium">{hour.day}</span>
                            <span>{hour.open} - {hour.close}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">Opening hours not specified</p>
                    )}
                  </div>
                </div>
              </div>
              
              {center.location.latitude && center.location.longitude && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-5 h-5 text-green-600 mr-2" />
                    Location
                  </h3>
                  <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center border border-gray-200">
                    {/* Map integration would go here */}
                    <div className="text-center p-4">
                      <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-gray-600">Interactive map would be displayed here</p>
                      <p className="text-sm text-gray-500 mt-1">Lat: {center.location.latitude}, Lng: {center.location.longitude}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {isOwnerOrAdmin && (
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Center
                  </button>
                  <Link href={`/recycling-centers/${center.id}/edit`}>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Center
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Materials & Prices</h2>
                {isOwnerOrAdmin && (
                  <Link href={`/recycling-centers/${center.id}/offers/new`}>
                    <button className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                      Add Material
                    </button>
                  </Link>
                )}
              </div>
              
              {Object.entries(center.materialsByCategory).length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                    <Info className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-700 font-medium mb-1">No Materials Listed</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    This recycling center has not listed any materials or prices yet.
                    {isOwnerOrAdmin && ' Click "Add Material" to add your first material.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(center.materialsByCategory).map(([category, materials]) => (
                    <div key={category} className="border rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-green-50 px-4 py-3 border-b">
                        <h3 className="font-semibold text-gray-900">{category}</h3>
                      </div>
                      <div className="divide-y">
                        {materials.map((material) => (
                          <div key={material.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div>
                              <h4 className="font-medium text-gray-900">{material.name}</h4>
                              {material.notes && (
                                <p className="text-sm text-gray-600 mt-1">{material.notes}</p>
                              )}
                              {material.minQuantity && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Minimum quantity: {material.minQuantity} kg
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-green-600">{material.price.toFixed(2)} €/kg</p>
                              {material.recyclable ? (
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                                  Recyclable
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mt-1">
                                  Non-recyclable
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'photos' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Photos</h2>
              
              {!center.images || center.images.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                    <Info className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-700 font-medium mb-1">No Photos Available</h3>
                  <p className="text-gray-500">
                    This recycling center has not uploaded any photos yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {center.images.map((image, index) => (
                    <div key={index} className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                      <Image 
                        src={image} 
                        alt={`${center.name} - Image ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {isOwnerOrAdmin && (
                <div className="mt-6 flex justify-end">
                  <Link href={`/recycling-centers/${center.id}/photos`}>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                      Manage Photos
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Reviews</h2>
              
              {!center.reviews || center.reviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                    <Star className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-700 font-medium mb-1">No Reviews Yet</h3>
                  <p className="text-gray-500">
                    Be the first to review this recycling center!
                  </p>
                  <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    Write a Review
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {center.reviews.map((review) => (
                    <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">{review.author}</div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      <div className="text-sm text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</div>
                      
                      {review.ownerReply && (
                        <div className="mt-3 bg-gray-50 p-3 rounded border-l-4 border-green-500">
                          <div className="font-medium text-sm text-gray-900 mb-1">Response from owner</div>
                          <p className="text-sm text-gray-700">{review.ownerReply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Claim modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {claimSuccess ? (
                <>
                  <div className="bg-green-100 p-2 rounded-full mr-2">
                    <FileCheck className="w-5 h-5 text-green-600" />
                  </div>
                  Success!
                </>
              ) : (
                <>
                  <div className="bg-blue-100 p-2 rounded-full mr-2">
                    <FileCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  Claim This Recycling Center
                </>
              )}
            </h2>
            
            {claimSuccess ? (
              <div>
                <p className="text-green-600 mb-4">
                  Your claim has been submitted successfully! You are now listed as the owner of this recycling center.
                </p>
                <p className="text-gray-700 mb-4">
                  As the owner, you can now:
                </p>
                <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
                  <li>Update center information</li>
                  <li>Add material offers and prices</li>
                  <li>Upload photos</li>
                  <li>Respond to reviews</li>
                </ul>
                <button
                  onClick={() => setClaimModalOpen(false)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Start Managing Your Center
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit}>
                <p className="mb-4 text-gray-600">
                  By claiming this listing, you confirm that you are an authorized representative of this recycling center.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why are you claiming this listing?
                  </label>
                  <textarea
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="I am the owner/manager/employee of this recycling center..."
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I confirm that I am authorized to manage this recycling center listing
                    </span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    disabled={claimLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={claimLoading}
                  >
                    {claimLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Claim'
                    )}
                  </button>
                </div>
                
                {error && (
                  <p className="mt-3 text-red-600 text-sm">{error}</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecyclingCenterDetail; 