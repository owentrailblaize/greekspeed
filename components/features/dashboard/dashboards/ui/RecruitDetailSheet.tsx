'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Phone, Instagram, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { toast } from 'react-toastify';
import type { Recruit, RecruitStage, UpdateRecruitRequest } from '@/types/recruitment';
import { cn } from '@/lib/utils';

const STAGE_COLORS: Record<RecruitStage, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Contacted': 'bg-slate-100 text-slate-700 border-slate-300',
  'Event Invite': 'bg-navy-50 text-navy-700 border-navy-200',
  'Bid Given': 'bg-gray-100 text-gray-700 border-gray-300',
  'Accepted': 'bg-blue-100 text-blue-800 border-blue-300',
  'Declined': 'bg-red-100 text-red-800 border-red-200',
};

const STAGE_OPTIONS: RecruitStage[] = [
  'New',
  'Contacted',
  'Event Invite',
  'Bid Given',
  'Accepted',
  'Declined',
];

interface RecruitDetailSheetProps {
  recruit: Recruit;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (recruit: Recruit) => void;
  onDelete: (recruitId: string) => void;
}

export function RecruitDetailSheet({
  recruit,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: RecruitDetailSheetProps) {
  const { session } = useAuth();
  const [editData, setEditData] = useState({
    stage: recruit.stage,
    notes: recruit.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset edit data when recruit changes
  useEffect(() => {
    if (recruit) {
      setEditData({
        stage: recruit.stage,
        notes: recruit.notes || '',
      });
    }
  }, [recruit]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.max(36, textareaRef.current.scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [editData.notes]);

  const hasChanges =
    editData.stage !== recruit.stage ||
    editData.notes !== (recruit.notes || '');

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const updatePayload: UpdateRecruitRequest = {};
      
      if (editData.stage !== recruit.stage) {
        updatePayload.stage = editData.stage;
      }
      
      if (editData.notes !== (recruit.notes || '')) {
        updatePayload.notes = editData.notes;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/recruitment/recruits/${recruit.id}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update recruit');
      }

      const updatedRecruit: Recruit = await response.json();
      onUpdate(updatedRecruit);
      toast.success('Recruit updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating recruit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update recruit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/recruitment/recruits/${recruit.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete recruit');
      }

      onDelete(recruit.id);
      toast.success('Recruit deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting recruit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete recruit');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative bg-white shadow-xl w-full flex flex-col max-h-[90vh] rounded-t-2xl rounded-b-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">Edit Recruit</h2>
            <Badge className={cn(STAGE_COLORS[recruit.stage])}>
              {recruit.stage}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Read-only Information */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500 uppercase">Name</Label>
              <p className="text-base font-medium text-gray-900 mt-1">{recruit.name}</p>
            </div>

            <div>
              <Label className="text-xs text-gray-500 uppercase">Hometown</Label>
              <p className="text-base text-gray-700 mt-1">{recruit.hometown}</p>
            </div>

            {recruit.phone_number && (
              <div>
                <Label className="text-xs text-gray-500 uppercase">Phone</Label>
                <a
                  href={`tel:${recruit.phone_number.replace(/\D/g, '')}`}
                  className="flex items-center space-x-2 text-base text-blue-600 hover:text-blue-700 mt-1"
                >
                  <Phone className="h-4 w-4" />
                  <span>{formatPhoneNumber(recruit.phone_number.replace(/\D/g, ''))}</span>
                </a>
              </div>
            )}

            {recruit.instagram_handle && (
              <div>
                <Label className="text-xs text-gray-500 uppercase">Instagram</Label>
                <a
                  href={`https://instagram.com/${recruit.instagram_handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-base text-pink-600 hover:text-pink-700 mt-1"
                >
                  <Instagram className="h-4 w-4" />
                  <span>@{recruit.instagram_handle}</span>
                </a>
              </div>
            )}

            {recruit.submitted_by_name && (
              <div>
                <Label className="text-xs text-gray-500 uppercase">Submitted By</Label>
                <p className="text-base text-gray-700 mt-1">{recruit.submitted_by_name}</p>
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-500 uppercase">Created</Label>
              <p className="text-base text-gray-700 mt-1">{formatDate(recruit.created_at)}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="space-y-1">
              <Label htmlFor="stage" className="text-xs font-medium text-gray-700">
                Stage
              </Label>
              <Select
                value={editData.stage}
                onValueChange={(value) =>
                  setEditData((prev) => ({ ...prev, stage: value as RecruitStage }))
                }
              >
                {STAGE_OPTIONS.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                ref={textareaRef}
                id="notes"
                value={editData.notes}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add notes..."
                className="mt-2 min-h-[36px] max-h-[200px] resize-y"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 space-x-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 rounded-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="flex-1 bg-navy-600 hover:bg-navy-700 rounded-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Recruit</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete {recruit.name}? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-full"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="flex-1 rounded-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

