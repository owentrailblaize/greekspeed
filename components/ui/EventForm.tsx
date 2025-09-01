'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, MapPin, DollarSign, FileText } from 'lucide-react';
import { Event, CreateEventRequest, UpdateEventRequest } from '@/types/events';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (data: CreateEventRequest | UpdateEventRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function EventForm({ event, onSubmit, onCancel, loading = false }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    budget_label: '',
    budget_amount: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        start_time: event.start_time,
        end_time: event.end_time,
        budget_label: event.budget_label || '',
        budget_amount: event.budget_amount || undefined,
      });
    }
  }, [event]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      if (new Date(formData.end_time) <= new Date(formData.start_time)) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    if (formData.budget_amount && formData.budget_amount < 0) {
      newErrors.budget_amount = 'Budget amount cannot be negative';
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

  const handleInputChange = (field: keyof CreateEventRequest, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader className="pb-4 sm:pb-6 sticky top-0 bg-white z-10 border-b border-gray-100">
        <CardTitle className="flex items-center space-x-3 sm:space-x-2 text-xl sm:text-lg">
          <Calendar className="h-6 w-6 sm:h-5 sm:w-5 text-navy-600" />
          <span>{event ? 'Edit Event' : 'Create New Event'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-6">
          {/* Title */}
          <div className="space-y-3 sm:space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2 text-base sm:text-sm">
              <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
              <span>Event Title *</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              className={`h-12 sm:h-10 text-base sm:text-sm ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3 sm:space-y-2">
            <Label htmlFor="description" className="text-base sm:text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter event description (optional)"
              rows={4}
              className="text-base sm:text-sm min-h-[120px] sm:min-h-[80px] resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-3 sm:space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2 text-base sm:text-sm">
              <MapPin className="h-5 w-5 sm:h-4 sm:w-4" />
              <span>Location</span>
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter event location (optional)"
              className="h-12 sm:h-10 text-base sm:text-sm"
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 sm:md:grid-cols-2 sm:gap-4">
            <div className="space-y-3 sm:space-y-2">
              <Label htmlFor="start_time" className="text-base sm:text-sm">Start Date & Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formatDateTimeLocal(formData.start_time)}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={`h-12 sm:h-10 text-base sm:text-sm ${errors.start_time ? 'border-red-500' : ''}`}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">{errors.start_time}</p>
              )}
            </div>

            <div className="space-y-3 sm:space-y-2">
              <Label htmlFor="end_time" className="text-base sm:text-sm">End Date & Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formatDateTimeLocal(formData.end_time)}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className={`h-12 sm:h-10 text-base sm:text-sm ${errors.end_time ? 'border-red-500' : ''}`}
              />
              {errors.end_time && (
                <p className="text-sm text-red-500">{errors.end_time}</p>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 sm:md:grid-cols-2 sm:gap-4">
            <div className="space-y-3 sm:space-y-2">
              <Label htmlFor="budget_label" className="flex items-center space-x-2 text-base sm:text-sm">
                <DollarSign className="h-5 w-5 sm:h-4 sm:w-4" />
                <span>Budget Label</span>
              </Label>
              <Input
                id="budget_label"
                value={formData.budget_label}
                onChange={(e) => handleInputChange('budget_label', e.target.value)}
                placeholder="e.g., Food, Venue, Entertainment"
                className="h-12 sm:h-10 text-base sm:text-sm"
              />
            </div>

            <div className="space-y-3 sm:space-y-2">
              <Label htmlFor="budget_amount" className="text-base sm:text-sm">Budget Amount</Label>
              <Input
                id="budget_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_amount || ''}
                onChange={(e) => handleInputChange('budget_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
                className={`h-12 sm:h-10 text-base sm:text-sm ${errors.budget_amount ? 'border-red-500' : ''}`}
              />
              {errors.budget_amount && (
                <p className="text-sm text-red-500">{errors.budget_amount}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 sm:pt-4 sticky bottom-0 bg-white border-t border-gray-100 mt-6 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="h-12 sm:h-10 w-full sm:w-auto text-base sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 h-12 sm:h-10 w-full sm:w-auto text-base sm:text-sm"
            >
              {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
