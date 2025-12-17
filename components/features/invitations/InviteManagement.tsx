'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, Eye, Edit, Trash2, Users, Calendar, Shield, Link, AlertCircle, X, Table, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateInviteModal } from './CreateInviteModal';
import { InviteSettings } from './InviteSettings';
import { InvitationWithUsage } from '@/types/invitations';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-toastify';

interface InviteManagementProps {
  chapterId: string;
  className?: string;
}

export function InviteManagement({ chapterId, className }: InviteManagementProps) {
  const [invitations, setInvitations] = useState<InvitationWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<InvitationWithUsage | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState<InvitationWithUsage | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/invitations?chapter_id=${chapterId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chapterId) {
      fetchInvitations();
    }
  }, [chapterId]);

  const handleCreateInvitation = async (invitationData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...invitationData,
          chapter_id: chapterId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invitation');
      }

      const data = await response.json();
      setInvitations(prev => [data.invitation, ...prev]);
      setShowCreateModal(false);
      toast.success('Invitation created successfully!');
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invitation');
    }
  };

  const handleUpdateInvitation = async (invitationData: any) => {
    if (!editingInvitation) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/invitations/${editingInvitation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update invitation');
      }

      const data = await response.json();
      setInvitations(prev => prev.map(inv => 
        inv.id === editingInvitation.id ? data.invitation : inv
      ));
      setEditingInvitation(null);
      toast.success('Invitation updated successfully!');
    } catch (error) {
      console.error('Error updating invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update invitation');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete invitation');
      }

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast.success('Invitation deleted successfully!');
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete invitation');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Invitation link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (invitation: InvitationWithUsage) => {
    if (!invitation.is_active) {
      return <Badge variant="secondary">Deactivated</Badge>;
    }
    
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (invitation.max_uses && invitation.usage.length >= invitation.max_uses) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  const getInvitationTypeBadge = (invitation: InvitationWithUsage) => {
    if (invitation.invitation_type === 'alumni') {
      return <Badge variant="outline" className="text-purple-600 border-purple-600">Alumni</Badge>;
    }
    return <Badge variant="outline" className="text-blue-600 border-blue-600">Active Member</Badge>;
  };

  const filteredInvitations = invitations;

  const renderInvitationsContent = () => {
    if (filteredInvitations.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No invitations yet
          </h3>
          <p className="text-gray-500 mb-4">
            {invitations.length === 0 
              ? 'Create your first invitation to start inviting new members to your chapter.'
              : 'No invitations found. Create a new invitation to get started.'
            }
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-12 sm:h-10 w-full sm:w-auto text-base sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invitation
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredInvitations.map((invitation) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className="font-medium text-gray-900">
                      Invitation #{invitation.token.slice(0, 8)}...
                    </h4>
                    {getInvitationTypeBadge(invitation)}
                    {getStatusBadge(invitation)}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{invitation.usage.length} uses</span>
                      {invitation.max_uses && (
                        <span>of {invitation.max_uses} max</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span>Auto-approve</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {invitation.expires_at 
                          ? `Expires ${formatDate(invitation.expires_at)}`
                          : 'No expiration'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-green-600 mb-2">
                    <div>
                      <span className="font-medium">Open invitation:</span> Accepts any email domain
                    </div>
                    {invitation.usage.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUsageModal(invitation)}
                        className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm"
                      >
                        <Table className="h-4 w-4 mr-1" />
                        View all {invitation.usage.length} usage records
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => invitation.invitation_url && handleCopyLink(invitation.invitation_url)}
                    title="Copy invitation link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingInvitation(invitation)}
                    title="Edit invitation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteInvitation(invitation.id)}
                    title="Delete invitation"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              {/* Header with invitation ID and status */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">
                  Invitation #{invitation.token.slice(0, 8)}...
                </h4>
                <div className="flex items-center space-x-1">
                  {getStatusBadge(invitation)}
                </div>
              </div>
              
              {/* Stats row - aligned with invitation ID */}
              <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{invitation.usage.length} uses</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {invitation.expires_at 
                      ? formatDate(invitation.expires_at).split(',')[0] // Just the date part
                      : 'No expiration'
                    }
                  </span>
                </div>
              </div>
              
              {/* Usage records button - aligned with invitation ID */}
              {invitation.usage.length > 0 && (
                <div className="mb-3 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUsageModal(invitation)}
                    className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs"
                  >
                    <Table className="h-3 w-3 mr-1" />
                    View all {invitation.usage.length} usage records
                  </Button>
                </div>
              )}
              
              {/* Action buttons - icons only */}
              <div className="flex justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => invitation.invitation_url && handleCopyLink(invitation.invitation_url)}
                  title="Copy invitation link"
                  className="p-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingInvitation(invitation)}
                  title="Edit invitation"
                  className="p-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteInvitation(invitation.id)}
                  title="Delete invitation"
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={`${className} bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900">Loading Invitations</h3>
              <p className="text-xs text-gray-600">Fetching your invitation data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Desktop: Use Card wrapper */}
      <Card className="hidden md:block bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="pb-4 border-b border-navy-100/30">
          {/* Desktop Layout */}
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-navy-900">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Manage Invites</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-9 rounded-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-9"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invitation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {renderInvitationsContent()}
        </CardContent>
      </Card>

      {/* Mobile: No Card wrapper - full width */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="px-4 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-navy-900 whitespace-nowrap overflow-hidden text-ellipsis">
              Invitation Management
            </h2>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-9 flex-1 rounded-full bg-gray-100/80 backdrop-blur-md border border-gray-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-gray-700 hover:text-gray-900 transition-all duration-300"
            >
              <Shield className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300 h-9 flex-1"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="pt-4 px-4">
          {renderInvitationsContent()}
        </div>
      </div>

      {/* Usage Details Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg max-w-5xl w-full h-[85vh] flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <Table className="h-5 w-5" />
                <span>Invitation Usage Details</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUsageModal(null)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Summary */}
            <div className="p-6 flex-shrink-0 border-b">
              <h3 className="text-lg font-medium mb-2">
                Invitation #{showUsageModal.token.slice(0, 8)}...
              </h3>
              <p className="text-sm text-gray-600">
                Total usage: {showUsageModal.usage.length} records
              </p>
            </div>
            
            {/* Table Section - Dynamic height */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full border border-gray-200 rounded-lg overflow-auto bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] md:min-w-[150px]">
                        User
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] md:min-w-[200px]">
                        Email
                      </th>
                      <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] md:min-w-[180px]">
                        Used At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {showUsageModal.usage.map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm font-medium text-gray-900 min-w-[80px] md:min-w-[150px]">
                          <div className="break-words">
                            {usage.user_name || 'Unknown User'}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500 min-w-[120px] md:min-w-[200px]">
                          <div className="break-all">
                            {usage.email}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500 min-w-[100px] md:min-w-[180px]">
                          <div className="text-xs md:text-sm">
                            {formatDate(usage.used_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-6 border-t flex-shrink-0">
              <Button 
                onClick={() => setShowUsageModal(null)} 
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <CreateInviteModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateInvitation}
        />
      )}

      {/* Edit Invitation Modal */}
      {editingInvitation && (
        <CreateInviteModal
          invitation={editingInvitation}
          onClose={() => setEditingInvitation(null)}
          onSubmit={handleUpdateInvitation}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <InviteSettings
          chapterId={chapterId}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
