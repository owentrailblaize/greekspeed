'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Building2, Phone, Mail, Globe, MapPin, Star } from 'lucide-react';
import { VendorContact, CreateVendorRequest, UpdateVendorRequest, VENDOR_TYPES } from '@/types/vendors';
import { logger } from "@/lib/utils/logger";

interface VendorFormProps {
  vendor?: VendorContact | null;
  onSubmit: (data: CreateVendorRequest | UpdateVendorRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function VendorForm({ vendor, onSubmit, onCancel, loading = false }: VendorFormProps) {
  const [formData, setFormData] = useState<CreateVendorRequest>({
    name: '',
    type: '',
    contact_person: '',
    phone: '',
    email: '',
    rating: undefined,
    notes: '',
    website: '',
    address: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        type: vendor.type,
        contact_person: vendor.contact_person || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        rating: vendor.rating || undefined,
        notes: vendor.notes || '',
        website: vendor.website || '',
        address: vendor.address || ''
      });
    }
  }, [vendor]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Vendor type is required';
    }

    if (formData.rating && (formData.rating < 0 || formData.rating > 5)) {
      newErrors.rating = 'Rating must be between 0 and 5';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      logger.error('Error submitting form:', { context: [error] });
    }
  };

  const handleInputChange = (field: keyof CreateVendorRequest, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Building2 className="h-5 w-5 text-navy-600" />
          <span>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              <span>Vendor Name *</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter vendor name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Vendor Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">Vendor Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: string) => handleInputChange('type', value)}
            >
              <SelectItem value="">Select vendor type</SelectItem>
              {VENDOR_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contact_person" className="text-sm font-medium">Contact Person</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              placeholder="Primary contact name"
            />
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2 text-sm font-medium">
                <Phone className="h-4 w-4" />
                <span>Phone</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@vendor.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating" className="flex items-center space-x-2 text-sm font-medium">
              <Star className="h-4 w-4" />
              <span>Rating (0-5)</span>
            </Label>
            <Input
              id="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={formData.rating || ''}
              onChange={(e) => handleInputChange('rating', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="4.5"
              className={errors.rating ? 'border-red-500' : ''}
            />
            {errors.rating && (
              <p className="text-sm text-red-500">{errors.rating}</p>
            )}
          </div>

          {/* Website and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center space-x-2 text-sm font-medium">
                <Globe className="h-4 w-4" />
                <span>Website</span>
              </Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://vendor.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center space-x-2 text-sm font-medium">
                <MapPin className="h-4 w-4" />
                <span>Address</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this vendor..."
              rows={2}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
