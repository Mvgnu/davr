'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { AlertTriangle, Loader2, Plus, Edit, Trash2, Star, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const centerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional().nullable(),
  address_street: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional(),
  phone_number: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable(),
  image_url: z.string().url('Invalid image URL').optional().nullable(),
});

const offerFormSchema = z.object({
  material_id: z.string(),
  price_per_unit: z.number().positive().optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

interface Center {
  id: string;
  name: string;
  description?: string;
  address_street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  image_url?: string;
  verification_status: string;
  averageRating: number;
  reviewCount: number;
  offers: Array<{
    id: string;
    material_id: string;
    price_per_unit?: number;
    unit?: string;
    notes?: string;
    material: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface Material {
  id: string;
  name: string;
  slug: string;
}

export default function OwnerCenterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [center, setCenter] = useState<Center | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);

  const centerForm = useForm<z.infer<typeof centerFormSchema>>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address_street: '',
      city: '',
      postal_code: '',
      country: 'Germany',
      phone_number: '',
      email: '',
      website: '',
      image_url: '',
    },
  });

  const offerForm = useForm<z.infer<typeof offerFormSchema>>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      material_id: '',
      price_per_unit: 0,
      unit: 'kg',
      notes: '',
    },
  });

  useEffect(() => {
    fetchCenter();
    fetchMaterials();
  }, [fetchCenter, fetchMaterials]);

  const fetchCenter = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/owner/centers/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setCenter(data.center);
        centerForm.reset({
          name: data.center.name || '',
          description: data.center.description || '',
          address_street: data.center.address_street || '',
          city: data.center.city || '',
          postal_code: data.center.postal_code || '',
          country: data.center.country || 'Germany',
          phone_number: data.center.phone_number || '',
          email: data.center.email || '',
          website: data.center.website || '',
          image_url: data.center.image_url || '',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load center',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load center',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [params.id, centerForm, toast]);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await fetch('/api/materials');
      const data = await response.json();
      if (data.success) {
        setMaterials(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch materials');
    }
  }, []);

  const handleCenterSubmit = async (values: z.infer<typeof centerFormSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/dashboard/owner/centers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Center updated successfully',
        });
        fetchCenter();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update center',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update center',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOfferSubmit = async (values: z.infer<typeof offerFormSchema>) => {
    setIsSubmitting(true);
    try {
      const method = editingOffer ? 'PUT' : 'POST';
      const url = editingOffer
        ? `/api/dashboard/owner/centers/${params.id}/offers/${editingOffer}`
        : `/api/dashboard/owner/centers/${params.id}/offers`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: editingOffer ? 'Offer updated successfully' : 'Offer added successfully',
        });
        offerForm.reset();
        setEditingOffer(null);
        setShowOfferForm(false);
        fetchCenter();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save offer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save offer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      const response = await fetch(`/api/dashboard/owner/centers/${params.id}/offers/${offerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Offer deleted successfully',
        });
        fetchCenter();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete offer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete offer',
        variant: 'destructive',
      });
    }
  };

  const startEditOffer = (offer: any) => {
    offerForm.reset({
      material_id: offer.material_id,
      price_per_unit: offer.price_per_unit,
      unit: offer.unit,
      notes: offer.notes,
    });
    setEditingOffer(offer.id);
    setShowOfferForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Center Not Found</h2>
        <p className="text-gray-600 mb-4">The center you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return CheckCircle;
      case 'PENDING': return Clock;
      case 'REJECTED': return XCircle;
      default: return Clock;
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const VerificationIcon = getVerificationIcon(center.verification_status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{center.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={getVerificationColor(center.verification_status)}>
              <VerificationIcon className="h-3 w-3 mr-1" />
              {center.verification_status}
            </Badge>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              {center.averageRating} ({center.reviewCount} reviews)
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/owner')}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Center Details</TabsTrigger>
          <TabsTrigger value="offers">Material Offers ({center.offers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Center Information</CardTitle>
            </CardHeader>
            <Form {...centerForm}>
              <form onSubmit={centerForm.handleSubmit(handleCenterSubmit)}>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={centerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Center Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={centerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={centerForm.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={centerForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={centerForm.control}
                    name="address_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={centerForm.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={centerForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={centerForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={centerForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={centerForm.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>

                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Material Offers</CardTitle>
                <Button
                  onClick={() => {
                    offerForm.reset();
                    setEditingOffer(null);
                    setShowOfferForm(!showOfferForm);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Offer
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {showOfferForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {editingOffer ? 'Edit Offer' : 'Add New Offer'}
                    </CardTitle>
                  </CardHeader>
                  <Form {...offerForm}>
                    <form onSubmit={offerForm.handleSubmit(handleOfferSubmit)}>
                      <CardContent className="space-y-4">
                        <FormField
                          control={offerForm.control}
                          name="material_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Material</FormLabel>
                              <FormControl>
                                <select {...field} className="w-full p-2 border rounded-md">
                                  <option value="">Select a material</option>
                                  {materials.map((material) => (
                                    <option key={material.id} value={material.id}>
                                      {material.name}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={offerForm.control}
                            name="price_per_unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price per Unit</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={offerForm.control}
                            name="unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="kg" value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={offerForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>

                      <CardFooter className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowOfferForm(false);
                            setEditingOffer(null);
                            offerForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            editingOffer ? 'Update Offer' : 'Add Offer'
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Form>
                </Card>
              )}

              <div className="space-y-4">
                {center.offers.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Material Offers</h3>
                    <p className="text-gray-600 mb-4">Add offers for materials you accept to attract more customers.</p>
                    <Button onClick={() => setShowOfferForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Offer
                    </Button>
                  </div>
                ) : (
                  center.offers.map((offer) => (
                    <Card key={offer.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{offer.material.name}</h4>
                            {offer.price_per_unit && (
                              <p className="text-sm text-green-600">
                                €{offer.price_per_unit} per {offer.unit || 'unit'}
                              </p>
                            )}
                            {offer.notes && (
                              <p className="text-sm text-gray-600 mt-1">{offer.notes}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditOffer(offer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteOffer(offer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}