'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Copy, Eye, Edit, Trash2, Users, Calendar, Shield, Link, AlertCircle } from 'lucide-react';
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
    
    if (invitation.max_uses && invitation.usage_count >= invitation.max_uses) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Invitation Management</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invitation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first invitation to start inviting new members to your chapter.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          Invitation #{invitation.token.slice(0, 8)}...
                        </h4>
                        {getStatusBadge(invitation)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{invitation.usage_count} uses</span>
                          {invitation.max_uses && (
                            <span>of {invitation.max_uses} max</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>
                            {invitation.approval_mode === 'auto' ? 'Auto-approve' : 'Manual approval'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {invitation.expires_at 
                              ? `Expires ${formatDate(invitation.expires_at)}`
                              : 'No expiration'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-green-600">
                        <span className="font-medium">Open invitation:</span> Accepts any email domain
                      </div>
                      
                      {invitation.usage.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Usage:</h5>
                          <div className="space-y-1">
                            {invitation.usage.slice(0, 3).map((usage) => (
                              <div key={usage.id} className="text-sm text-gray-600">
                                {usage.user_name || usage.email} - {formatDate(usage.used_at)}
                              </div>
                            ))}
                            {invitation.usage.length > 3 && (
                              <div className="text-sm text-gray-500">
                                +{invitation.usage.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(invitation.invitation_url)}
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
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
