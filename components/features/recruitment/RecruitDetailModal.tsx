'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit, Save, X, AlertCircle, Phone, Instagram, Calendar, User } from 'lucide-react';
import type { Recruit, UpdateRecruitRequest, RecruitStage } from '@/types/recruitment';
import { useAuth } from '@/lib/supabase/auth-context';

interface RecruitDetailModalProps {
  recruit: Recruit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedRecruit: Recruit) => void;
}

const STAGE_COLORS: Record<RecruitStage, string> = {
  'New': 'bg-blue-100 text-blue-800 border-blue-200',
  'Contacted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Event Invite': 'bg-purple-100 text-purple-800 border-purple-200',
  'Bid Given': 'bg-orange-100 text-orange-800 border-orange-200',
  'Accepted': 'bg-green-100 text-green-800 border-green-200',
  'Declined': 'bg-red-100 text-red-800 border-red-200',
};

const STAGE_OPTIONS: RecruitStage[] = ['New', 'Contacted', 'Event Invite', 'Bid Given', 'Accepted', 'Declined'];

export function RecruitDetailModal({ recruit, isOpen, onClose, onUpdate }: RecruitDetailModalProps) {
  const { session, getAuthHeaders } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateRecruitRequest>({});

  // Initialize form data when recruit changes
  useEffect(() => {
    if (recruit) {
      setFormData({
        name: recruit.name,
        hometown: recruit.hometown,
        phone_number: recruit.phone_number || '',
        instagram_handle: recruit.instagram_handle || '',
        stage: recruit.stage,
        notes: recruit.notes || '',
      });
      setIsEditing(false);
      setError(null);
    }
  }, [recruit]);

  // Phone number formatting
  const formatPhoneNumber = (value: string): string => {
    const phoneNumber = value.replace(/\D/g, '');
    const limitedPhone = phoneNumber.slice(0, 10);
    
    if (limitedPhone.length === 0) return '';
    if (limitedPhone.length < 4) return `(${limitedPhone}`;
    if (limitedPhone.length < 7) {
      return `(${limitedPhone.slice(0, 3)}) ${limitedPhone.slice(3)}`;
    }
    return `(${limitedPhone.slice(0, 3)}) ${limitedPhone.slice(3, 6)}-${limitedPhone.slice(6)}`;
  };

  // Phone number validation
  const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim().length === 0) return true; // Optional field
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  };

  // Normalize Instagram handle (strip @ symbol)
  const normalizeInstagramHandle = (handle: string): string => {
    return handle.replace(/^@+/, '').trim();
  };

  // Handle input changes
  const handleInputChange = (field: keyof UpdateRecruitRequest, value: string) => {
    setError(null);

    // Special handling for phone number (format as user types)
    if (field === 'phone_number') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } 
    // Special handling for Instagram handle (strip @ symbol)
    else if (field === 'instagram_handle') {
      const normalized = normalizeInstagramHandle(value);
      setFormData(prev => ({ ...prev, [field]: normalized }));
    } 
    else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    // Name validation (required if provided)
    if (formData.name !== undefined && (!formData.name || !formData.name.trim())) {
      setError('Name must be a non-empty string');
      return false;
    }

    // Hometown validation (required if provided)
    if (formData.hometown !== undefined && (!formData.hometown || !formData.hometown.trim())) {
      setError('Hometown must be a non-empty string');
      return false;
    }

    // Phone number validation (optional, but must be valid if provided)
    if (formData.phone_number !== undefined && formData.phone_number && !isValidPhoneNumber(formData.phone_number)) {
      setError('Invalid phone number format. Please provide a valid 10 or 11 digit phone number.');
      return false;
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!recruit) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build update payload with only changed fields
      const updatePayload: UpdateRecruitRequest = {};
      
      if (formData.name !== recruit.name) updatePayload.name = formData.name;
      if (formData.hometown !== recruit.hometown) updatePayload.hometown = formData.hometown;
      if (formData.phone_number !== (recruit.phone_number || '')) {
        updatePayload.phone_number = formData.phone_number || null;
      }
      if (formData.instagram_handle !== (recruit.instagram_handle || '')) {
        updatePayload.instagram_handle = formData.instagram_handle || null;
      }
      if (formData.stage !== recruit.stage) updatePayload.stage = formData.stage;
      if (formData.notes !== (recruit.notes || '')) {
        updatePayload.notes = formData.notes || null;
      }

      // If no changes, just close edit mode
      if (Object.keys(updatePayload).length === 0) {
        setIsEditing(false);
        setLoading(false);
        return;
      }

      const headers = getAuthHeaders();
      const response = await fetch(`/api/recruitment/recruits/${recruit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update recruit' }));
        throw new Error(errorData.error || 'Failed to update recruit');
      }

      const updatedRecruit: Recruit = await response.json();
      onUpdate(updatedRecruit);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating recruit:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (recruit) {
      // Reset form data to original recruit data
      setFormData({
        name: recruit.name,
        hometown: recruit.hometown,
        phone_number: recruit.phone_number || '',
        instagram_handle: recruit.instagram_handle || '',
        stage: recruit.stage,
        notes: recruit.notes || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Format phone number for display
  const formatPhoneNumberDisplay = (phone: string | null | undefined): string => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (!recruit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Recruit Details</span>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm font-medium">{recruit.name}</p>
            )}
          </div>

          {/* Hometown */}
          <div>
            <Label htmlFor="hometown">Hometown</Label>
            {isEditing ? (
              <Input
                id="hometown"
                value={formData.hometown || ''}
                onChange={(e) => handleInputChange('hometown', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm font-medium">{recruit.hometown}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number || ''}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="(XXX) XXX-XXXX"
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm font-medium flex items-center space-x-2">
                {recruit.phone_number ? (
                  <>
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{formatPhoneNumberDisplay(recruit.phone_number)}</span>
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </p>
            )}
          </div>

          {/* Instagram Handle */}
          <div>
            <Label htmlFor="instagram_handle">Instagram Handle</Label>
            {isEditing ? (
              <Input
                id="instagram_handle"
                value={formData.instagram_handle || ''}
                onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
                placeholder="@username"
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm font-medium flex items-center space-x-2">
                {recruit.instagram_handle ? (
                  <a
                    href={`https://instagram.com/${recruit.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>@{recruit.instagram_handle}</span>
                  </a>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </p>
            )}
          </div>

          {/* Stage */}
          <div>
            <Label htmlFor="stage">Stage</Label>
            {isEditing ? (
              <Select
                value={formData.stage || 'New'}
                onValueChange={(value) => handleInputChange('stage', value as RecruitStage)}
                className="mt-1"
              >
                {STAGE_OPTIONS.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </Select>
            ) : (
              <div className="mt-1">
                <Badge className={`${STAGE_COLORS[recruit.stage]} border`}>
                  {recruit.stage}
                </Badge>
              </div>
            )}
          </div>

          {/* Notes (Exec-only) */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add notes about this recruit..."
                className="mt-1 min-h-[100px]"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                {recruit.notes || <span className="text-gray-400">No notes</span>}
              </p>
            )}
          </div>

          {/* Submitted By */}
          <div>
            <Label>Submitted By</Label>
            <p className="mt-1 text-sm font-medium flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{recruit.submitted_by_name || 'Unknown'}</span>
            </p>
          </div>

          {/* Created At */}
          <div>
            <Label>Created</Label>
            <p className="mt-1 text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(recruit.created_at)}</span>
            </p>
          </div>

          {/* Updated At */}
          {recruit.updated_at !== recruit.created_at && (
            <div>
              <Label>Last Updated</Label>
              <p className="mt-1 text-sm font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(recruit.updated_at)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

