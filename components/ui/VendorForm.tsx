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
import { cn } from '@/lib/utils';

interface VendorFormProps {
  vendor?: VendorContact | null;
  onSubmit: (data: CreateVendorRequest | UpdateVendorRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isMobile?: boolean;
}

export function VendorForm({ vendor, onSubmit, onCancel, loading = false, isMobile = false }: VendorFormProps) {
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
      console.error('Error submitting form:', error);
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
    <Card className={cn(
      "w-full mx-auto flex flex-col h-full",
      isMobile 
        ? "rounded-none shadow-none border-0 h-full min-h-0 bg-transparent" // Transparent background, let drawer handle it
        : "max-w-3xl max-h-[90vh]" // Desktop max-width and height
    )}>
      {/* Header - Fixed at top */}
      <CardHeader className={cn(
        "flex-shrink-0 border-b border-gray-200 bg-white",
        isMobile ? "p-4" : "px-6 py-4"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center space-x-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            <Building2 className="h-5 w-5 text-brand-primary" />
            <span>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</span>
          </CardTitle>
        </div>
      </CardHeader>

      {/* Scrollable Content Area */}
      <CardContent className={cn(
        "flex-1 overflow-y-auto min-h-0",
        isMobile ? "p-4" : "px-6 py-4"
      )}>
        <form onSubmit={handleSubmit} id="vendor-form" className="space-y-4">
          {/* Vendor Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-2 text-sm font-medium">
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
          <div className={cn(
            "gap-4",
            isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2"
          )}>
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
          <div className={cn(
            "gap-4",
            isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2"
          )}>
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
        </form>
      </CardContent>
      
      {/* Footer - Fixed at bottom with form actions */}
      <div className={cn(
        "flex-shrink-0 border-t border-gray-200 bg-white",
        isMobile 
          ? "p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
          : "px-6 py-4"
      )}>
        {isMobile ? (
          <div className="flex flex-row space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-full bg-white/80 backdrop-blur-md border border-brand-primary/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-brand-primary-hover hover:text-primary-900 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="vendor-form"
              disabled={loading}
              className="flex-1 rounded-full bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-navy-100/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
            </Button>
          </div>
        ) : (
          <div className="flex space-x-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="rounded-full bg-white/80 backdrop-blur-md border border-brand-primary/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-brand-primary-hover hover:text-primary-900 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="vendor-form"
              disabled={loading}
              className="rounded-full bg-brand-primary hover:bg-brand-primary-hover shadow-lg shadow-navy-100/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (vendor ? 'Update Vendor' : 'Add Vendor')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}