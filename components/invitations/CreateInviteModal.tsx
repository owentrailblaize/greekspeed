'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Calendar, Shield, Users, Mail, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { InvitationWithUsage, CreateInvitationData, UpdateInvitationData } from '@/types/invitations';
import { generateInvitationUrl } from '@/lib/utils/invitationUtils';
import { toast } from 'react-toastify';

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
    is_active: invitation?.is_active ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        email_domain_allowlist: [], // Always empty - no email restrictions
        approval_mode: formData.approval_mode,
        expires_at: formData.expires_at || null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        is_active: formData.is_active
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
      const url = generateInvitationUrl(invitation.token);
      navigator.clipboard.writeText(url);
      toast.success('Invitation link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {invitation ? 'Edit Invitation' : 'Create New Invitation'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Approval Mode */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Auto-Approval Enabled</span>
            </Label>
            <p className="text-sm text-gray-600">
              All new members will be automatically approved and gain immediate access to the chapter dashboard.
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

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Saving...' : invitation ? 'Update Invitation' : 'Create Invitation'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
