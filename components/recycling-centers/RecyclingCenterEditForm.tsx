'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import toast from 'react-hot-toast';
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
import { AlertTriangle, X, Plus, Clock, Package, Loader2 } from 'lucide-react';
import { MaterialsList } from '@/components/recycling-centers/MaterialsList';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import MaterialOfferForm from './MaterialOfferForm';

const formSchema = z.object({
  name: z.string().min(3, 'Name muss mindestens 3 Zeichen haben').max(100),
  address: z.string().min(5, 'Adresse muss mindestens 5 Zeichen haben').max(200),
  city: z.string().min(2, 'Stadt muss mindestens 2 Zeichen haben').max(100),
  postalCode: z.string().min(5, 'PLZ muss mindestens 5 Zeichen haben').max(10),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  website: z.string().url('Ungültige Website-URL').optional().or(z.literal('')),
  description: z.string().optional(),
  openingHours: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const DAYS_OF_WEEK = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

type MaterialOffer = {
  id?: number;
  materialId: number;
  materialName?: string;
  price: number;
  minQuantity: number;
  maxQuantity?: number;
  notes?: string;
  active: boolean;
};

type Material = {
  id: number;
  name: string;
  category: string;
};

interface RecyclingCenterEditFormProps {
  centerId: number;
  initialData?: any;
  onCancel: () => void;
  onSubmit?: (data: any) => void;
}

export function RecyclingCenterEditForm({
  centerId,
  initialData,
  onCancel,
  onSubmit,
}: RecyclingCenterEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialOffers, setMaterialOffers] = useState<MaterialOffer[]>([]);
  const [acceptedMaterials, setAcceptedMaterials] = useState<number[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [openingHoursType, setOpeningHoursType] = useState<'simple' | 'structured'>('simple');
  const [structuredHours, setStructuredHours] = useState<any[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      open: false,
      openTime: '09:00',
      closeTime: '18:00',
    }))
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      postalCode: initialData?.postalCode || initialData?.location?.zipCode || '',
      state: initialData?.state || initialData?.location?.state || '',
      phone: initialData?.phone || initialData?.contact?.phone || '',
      email: initialData?.email || initialData?.contact?.email || '',
      website: initialData?.website || initialData?.contact?.website || '',
      description: initialData?.description || '',
      openingHours: initialData?.openingHours || '',
      latitude: initialData?.latitude || initialData?.location?.latitude || undefined,
      longitude: initialData?.longitude || initialData?.location?.longitude || undefined,
    },
  });

  // Fetch materials list on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get('/api/materials');
        if (response.data.success) {
          setMaterials(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching materials:', error);
        setError('Materialien konnten nicht geladen werden.');
      }
    };
    
    fetchMaterials();
  }, []);

  // Set up initial material offers and accepted materials if they exist
  useEffect(() => {
    if (initialData) {
      if (initialData.materialOffers && initialData.materialOffers.length > 0) {
        setMaterialOffers(initialData.materialOffers);
      }
      
      if (initialData.acceptedMaterials && initialData.acceptedMaterials.length > 0) {
        setAcceptedMaterials(initialData.acceptedMaterials.map((m: any) => m.materialId));
      }
      
      // Setup structured hours if openingHours contains JSON data
      if (initialData.openingHours) {
        try {
          const parsedHours = JSON.parse(initialData.openingHours);
          if (Array.isArray(parsedHours) && parsedHours.length === 7) {
            setOpeningHoursType('structured');
            setStructuredHours(parsedHours);
          }
        } catch (e) {
          // If it's not valid JSON, it's a simple text format
          setOpeningHoursType('simple');
        }
      }
    }
  }, [initialData]);

  const addMaterialOffer = (offer: MaterialOffer) => {
    // If editing, update the existing offer
    if (editingOfferId !== null) {
      setMaterialOffers(prev => 
        prev.map(o => o.id === editingOfferId ? { ...offer, id: o.id } : o)
      );
      setEditingOfferId(null);
    } 
    // Otherwise add a new offer
    else {
      setMaterialOffers(prev => [...prev, offer]);
    }
    setSelectedMaterialId(null);
  };

  const editMaterialOffer = (id: number) => {
    const offer = materialOffers.find(o => o.id === id);
    if (offer) {
      setSelectedMaterialId(offer.materialId);
      setEditingOfferId(id);
    }
  };

  const removeMaterialOffer = (id: number | undefined) => {
    if (id) {
      setMaterialOffers(prev => prev.filter(o => o.id !== id));
    } else {
      // Handle removing an offer that doesn't have an ID yet (newly added)
      const index = materialOffers.findIndex(o => o.id === undefined);
      if (index !== -1) {
        setMaterialOffers(prev => {
          const newOffers = [...prev];
          newOffers.splice(index, 1);
          return newOffers;
        });
      }
    }
  };

  const handleMaterialCheckboxChange = (materialId: number, checked: boolean) => {
    if (checked) {
      setAcceptedMaterials(prev => [...prev, materialId]);
    } else {
      setAcceptedMaterials(prev => prev.filter(id => id !== materialId));
    }
  };

  const handleStructuredHoursChange = (index: number, field: string, value: any) => {
    setStructuredHours(prev => {
      const newHours = [...prev];
      newHours[index] = { ...newHours[index], [field]: value };
      return newHours;
    });
  };

  const formatStructuredHoursToString = (): string => {
    const formatted = structuredHours.map(day => {
      if (!day.open) return `${day.day}: Geschlossen`;
      return `${day.day}: ${day.openTime} - ${day.closeTime}`;
    }).join('\n');
    
    return formatted;
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare opening hours data based on selected type
      let finalOpeningHours = values.openingHours;
      if (openingHoursType === 'structured') {
        // Store as JSON string for structured format
        finalOpeningHours = JSON.stringify(structuredHours);
      }
      
      const updateData = {
        ...values,
        openingHours: finalOpeningHours,
        materialOffers,
        acceptedMaterials,
      };
      
      // Update via API
      const response = await axios.patch(`/api/recycling-centers/${centerId}`, updateData);
      
      if (response.data.success) {
        toast.success('Recycling-Center erfolgreich aktualisiert');
        
        // Call the onSubmit callback if provided
        if (onSubmit) {
          onSubmit(response.data.center);
        } else {
          // Navigate to detail page
          router.push(`/recycling-centers/${response.data.center.location.city.toLowerCase()}/${response.data.center.slug}`);
          router.refresh();
        }
      } else {
        setError(response.data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (error: any) {
      console.error('Error updating recycling center:', error);
      setError(error.response?.data?.error || 'Ein Fehler ist beim Aktualisieren aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const materialCategories = materials.reduce((acc: Record<string, Material[]>, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {});

  // Find selected material details if needed for material offer form
  const selectedMaterial = selectedMaterialId 
    ? materials.find(m => m.id === selectedMaterialId) 
    : null;

  // Get material details for existing offers (for display)
  const enrichedMaterialOffers = materialOffers.map(offer => {
    const material = materials.find(m => m.id === offer.materialId);
    return {
      ...offer,
      materialName: material?.name || 'Unbekanntes Material',
      category: material?.category || 'Keine Kategorie',
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recycling-Center bearbeiten</CardTitle>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 p-4 rounded-md flex items-start space-x-3 text-red-800 border border-red-200">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Allgemeine Informationen</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name des Recycling-Centers</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straße & Hausnummer</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PLZ</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stadt</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bundesland</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breitengrad</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.000001"
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
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Längengrad</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.000001"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Kontaktinformationen</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefonnummer</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Mail</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="https://" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Über das Recycling-Center</h3>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          rows={5}
                          placeholder="Beschreiben Sie das Recycling-Center, seine Dienste und Besonderheiten."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Öffnungszeiten</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium text-sm">Format:</div>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={openingHoursType === 'simple' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOpeningHoursType('simple')}
                      >
                        Einfacher Text
                      </Button>
                      <Button
                        type="button" 
                        variant={openingHoursType === 'structured' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOpeningHoursType('structured')}
                      >
                        Strukturierte Zeiten
                      </Button>
                    </div>
                  </div>
                  
                  {openingHoursType === 'simple' ? (
                    <FormField
                      control={form.control}
                      name="openingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Öffnungszeiten</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ''}
                              rows={7}
                              placeholder="z.B. Montag-Freitag: 8:00-18:00&#10;Samstag: 9:00-14:00&#10;Sonntag: Geschlossen"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="space-y-4 border rounded-md p-4">
                      {structuredHours.map((day, index) => (
                        <div key={day.day} className="flex flex-wrap items-center gap-4">
                          <div className="w-24 font-medium">{day.day}</div>
                          
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`day-${index}-open`}
                              checked={day.open}
                              onCheckedChange={(checked) => 
                                handleStructuredHoursChange(index, 'open', Boolean(checked))
                              }
                            />
                            <label htmlFor={`day-${index}-open`} className="text-sm">
                              Geöffnet
                            </label>
                          </div>
                          
                          {day.open && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={day.openTime}
                                onChange={(e) => 
                                  handleStructuredHoursChange(index, 'openTime', e.target.value)
                                }
                                className="w-32"
                              />
                              <span>bis</span>
                              <Input
                                type="time"
                                value={day.closeTime}
                                onChange={(e) => 
                                  handleStructuredHoursChange(index, 'closeTime', e.target.value)
                                }
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Hidden field to store formatted hours for simple view */}
                      <input
                        type="hidden"
                        {...form.register('openingHours')}
                        value={formatStructuredHoursToString()}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Materialannahme</h3>
                
                <Tabs defaultValue="accepted">
                  <TabsList>
                    <TabsTrigger value="accepted">Akzeptierte Materialien</TabsTrigger>
                    <TabsTrigger value="bought">Materialien mit Ankaufpreis</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="accepted" className="space-y-4 pt-4">
                    <p className="text-sm text-gray-600">
                      Wählen Sie die Materialien aus, die dieses Recycling-Center annimmt (ohne Ankauf):
                    </p>
                    
                    <div className="border rounded-md">
                      <ScrollArea className="h-64">
                        <div className="p-4">
                          {Object.entries(materialCategories).map(([category, categoryMaterials]) => (
                            <div key={category} className="mb-4">
                              <h4 className="font-medium mb-2">{category}</h4>
                              <div className="space-y-2">
                                {categoryMaterials.map((material) => (
                                  <div key={material.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`material-${material.id}`}
                                      checked={acceptedMaterials.includes(material.id)}
                                      onCheckedChange={(checked) => 
                                        handleMaterialCheckboxChange(material.id, Boolean(checked))
                                      }
                                    />
                                    <label 
                                      htmlFor={`material-${material.id}`}
                                      className="text-sm"
                                    >
                                      {material.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bought" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Verwalten Sie hier Materialien, die das Recycling-Center ankauft:
                      </p>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMaterialId(null)}
                        disabled={selectedMaterialId !== null}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Angebot hinzufügen
                      </Button>
                    </div>
                    
                    {selectedMaterialId === null ? (
                      <div className="border rounded-md overflow-hidden">
                        {enrichedMaterialOffers.length > 0 ? (
                          <div className="divide-y">
                            {enrichedMaterialOffers.map((offer) => (
                              <div 
                                key={offer.id || `new-${offer.materialId}`} 
                                className="p-4 hover:bg-gray-50 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium">{offer.materialName}</div>
                                  <div className="text-sm text-gray-600">{offer.category}</div>
                                  <div className="text-sm font-medium text-green-600 mt-1">
                                    {offer.price.toFixed(2)} €/kg
                                    {offer.minQuantity > 0 && ` (min. ${offer.minQuantity} kg)`}
                                  </div>
                                  {offer.notes && (
                                    <div className="text-xs text-gray-500 mt-1">{offer.notes}</div>
                                  )}
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => editMaterialOffer(offer.id!)}
                                  >
                                    Bearbeiten
                                  </Button>
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeMaterialOffer(offer.id)}
                                  >
                                    Entfernen
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-gray-500 mb-2">Keine Materialangebote</h3>
                            <p className="text-gray-400 text-sm mb-4">
                              Fügen Sie Materialien hinzu, die das Recycling-Center ankauft.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMaterialId(null)}
                              disabled={selectedMaterialId !== null}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Angebot hinzufügen
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {editingOfferId !== null ? 'Angebot bearbeiten' : 'Neues Angebot'}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMaterialId(null);
                                setEditingOfferId(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <MaterialOfferForm
                            materials={materials}
                            selectedMaterialId={selectedMaterialId}
                            onSelectMaterial={setSelectedMaterialId}
                            initialData={editingOfferId !== null 
                              ? materialOffers.find(o => o.id === editingOfferId) 
                              : undefined
                            }
                            onSubmit={addMaterialOffer}
                            onCancel={() => {
                              setSelectedMaterialId(null);
                              setEditingOfferId(null);
                            }}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Änderungen speichern'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
} 