'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, MapPin, Mail, Phone, Globe, Hash, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RecyclingCenter {
  id: string;
  name: string;
  description: string | null;
  address_street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  email: string | null;
  phone_number: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  image_url: string | null;
  managedById: string | null;
  managedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  created_at: Date;
  updated_at: Date;
}

interface CenterEditorDialogProps {
  center: RecyclingCenter | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedCenter: RecyclingCenter) => void;
}

export default function CenterEditorDialog({ center, isOpen, onOpenChange, onSave }: CenterEditorDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize form fields when center changes or dialog opens
  useEffect(() => {
    if (center && isOpen) {
      setName(center.name);
      setDescription(center.description || '');
      setAddress(center.address_street || '');
      setCity(center.city || '');
      setPostalCode(center.postal_code || '');
      setCountry(center.country || 'Germany');
      setEmail(center.email || '');
      setPhone(center.phone_number || '');
      setLatitude(center.latitude?.toString() || '');
      setLongitude(center.longitude?.toString() || '');
    } else if (isOpen) {
      // Reset for new center
      setName('');
      setDescription('');
      setAddress('');
      setCity('');
      setPostalCode('');
      setCountry('Germany');
      setEmail('');
      setPhone('');
      setLatitude('');
      setLongitude('');
    }
  }, [center, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name for the recycling center');
      return;
    }

    setIsSaving(true);
    try {
      const centerData = {
        id: center?.id,
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || 'Germany',
        email: email.trim() || null,
        phone: phone.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      const method = center?.id ? 'PUT' : 'POST';
      const url = '/api/dashboard/admin/recycling-centers';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(centerData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(center?.id ? 'Center updated successfully' : 'Center created successfully');
        onSave({
          ...center,
          ...result.data,
          created_at: center?.created_at || new Date(),
          updated_at: new Date(),
        } as RecyclingCenter);
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Failed to save center');
      }
    } catch (error) {
      toast.error('Failed to save center');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {center?.id ? 'Edit Recycling Center' : 'Add New Recycling Center'}
          </DialogTitle>
          <DialogDescription>
            {center?.id 
              ? 'Update the details for this recycling center.' 
              : 'Add a new recycling center to the platform.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-6">
          {!center?.id && (
            <Alert>
              <AlertDescription>
                Note: New centers will be created with a "PENDING" verification status.
                You can change the verification status after creation.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Center Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter center name"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="center@example.com"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 123 456 7890"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Germany"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postal-code">Postal Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="postal-code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="10115"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="52.5200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="13.4050"
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the recycling center and its services"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {center?.id ? 'Update Center' : 'Create Center'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}