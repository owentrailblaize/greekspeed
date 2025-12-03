'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Calendar, Shield, Users, Mail, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { InvitationWithUsage, CreateInvitationData, UpdateInvitationData } from '@/types/invitations';
import { generateInvitationUrl } from '@/lib/utils/invitationUtils';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface CreateInviteModalProps {
  invitation?: InvitationWithUsage;
  onClose: () => void;
  onSubmit: (data: CreateInvitationData | UpdateInvitationData) => void;
}

export function CreateInviteModal({ invitation, onClose, onSubmit }: CreateInviteModalProps) {
  const [formData, setFormData] = useState({
    email_domain_allowlist: [], // Always empty - no restrictions
    approval_mode: invitation?.approval_mode || 'auto',
    expires_at: invitation?.expires_at ? new Date(invitation.expires_at).toISOString().slice(0, 16) : '',
    max_uses: invitation?.max_uses?.toString() || '',
    is_active: invitation?.is_active ?? true,
    invitation_type: invitation?.invitation_type || 'active_member'
  });
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        email_domain_allowlist: [], // Always empty - no email restrictions
        approval_mode: formData.approval_mode,
        expires_at: formData.expires_at || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        is_active: formData.is_active,
        invitation_type: formData.invitation_type
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = () => {
    if (invitation) {
      const url = generateInvitationUrl(invitation.token, invitation.invitation_type);
      navigator.clipboard.writeText(url);
      toast.success('Invitation link copied to clipboard!');
    }
  };

  // Content component (shared between mobile and desktop)
  const content = (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b flex-shrink-0 bg-white">
        <h2 className="text-lg md:text-xl font-semibold">
          {invitation ? 'Edit Invitation' : 'Create New Invitation'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <form id="invite-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Invitation Type */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>Invitation Type</span>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="active_member"
                name="invitation_type"
                value="active_member"
                checked={formData.invitation_type === 'active_member'}
                onChange={(e) => setFormData(prev => ({ ...prev, invitation_type: e.target.value as 'active_member' | 'alumni' }))}
                className="text-blue-600"
              />
              <Label htmlFor="active_member" className="text-sm">
                Active Member
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="alumni"
                name="invitation_type"
                value="alumni"
                checked={formData.invitation_type === 'alumni'}
                onChange={(e) => setFormData(prev => ({ ...prev, invitation_type: e.target.value as 'active_member' | 'alumni' }))}
                className="text-purple-600"
              />
              <Label htmlFor="alumni" className="text-sm">
                Alumni
              </Label>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {formData.invitation_type === 'active_member' 
              ? 'Active member invitations are for current students and recent graduates who want to join as active chapter members.'
              : 'Alumni invitations are for graduates who want to join as alumni members with professional networking features.'
            }
          </p>
        </div>

        {/* Approval Mode */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Auto-Approval Enabled</span>
          </Label>
          <p className="text-sm text-gray-600">
            All new {formData.invitation_type === 'active_member' ? 'members' : 'alumni'} will be automatically approved and gain immediate access to the chapter dashboard.
          </p>
        </div>

        {/* Email Domain Info */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email Access</span>
          </Label>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Open Invitation</h4>
                <p className="text-sm text-green-800 mt-1">
                  This invitation accepts any email address from any domain. Anyone with the invitation link can join using their preferred email address.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_uses" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Maximum Uses</span>
            </Label>
            <Input
              id="max_uses"
              type="number"
              min="1"
              placeholder="Leave empty for unlimited"
              value={formData.max_uses}
              onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
            />
            <p className="text-sm text-gray-500">
              Maximum number of people who can use this invitation. Leave empty for unlimited.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Expiration Date</span>
            </Label>
            <Input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
            />
            <p className="text-sm text-gray-500">
              When this invitation expires. Leave empty for no expiration.
            </p>
          </div>
        </div>

        {/* Email Uniqueness Info */}
        <div className="space-y-2">
          <Label className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span>Email Uniqueness</span>
          </Label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">One Account Per Email</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Each email address can only create one account across the entire system. If someone tries to use an email that already has an account, they'll be prompted to sign in instead.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Status (only for editing) */}
        {invitation && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        )}

        {/* Show invitation link if editing */}
        {invitation && (
          <div className="space-y-2">
            <Label>Invitation Link</Label>
            <div className="flex space-x-2">
              <Input
                value={generateInvitationUrl(invitation.token)}
                readOnly
                className="bg-gray-50"
              />
              <Button
                type="button"
                onClick={copyInvitationLink}
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Form Actions */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-full bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-12 sm:h-10 w-full sm:w-auto text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-12 sm:h-10 w-full sm:w-auto text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                invitation ? 'Update Invitation' : 'Create Invitation'
              )}
            </Button>
          </div>
        )}
      </form>

      {/* Mobile Footer - Fixed */}
      {isMobile && (
        <div className="flex-shrink-0 border-t bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex flex-col space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="invite-form"
              disabled={loading}
              className="w-full rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                invitation ? 'Update Invitation' : 'Create Invitation'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile: Bottom Drawer
  if (isMobile && typeof window !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        
        {/* Bottom Drawer */}
        <div className="relative bg-white shadow-xl w-full flex flex-col h-[80vh] max-h-[80vh] mt-[50vh] rounded-t-2xl rounded-b-none overflow-hidden">
          {content}
        </div>
      </div>,
      document.body
    );
  }

  // Desktop: Centered Modal (unchanged)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {content}
      </motion.div>
    </div>
  );
}
