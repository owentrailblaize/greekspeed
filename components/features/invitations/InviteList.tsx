'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Eye, Edit, Trash2, Users, Calendar, Shield, Link, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InvitationWithUsage } from '@/types/invitations';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { logger } from "@/lib/utils/logger";

interface InviteListProps {
  chapterId: string;
  onEdit?: (invitation: InvitationWithUsage) => void;
  onDelete?: (invitationId: string) => void;
  className?: string;
}

export function InviteList({ chapterId, onEdit, onDelete, className }: InviteListProps) {
  const [invitations, setInvitations] = useState<InvitationWithUsage[]>([]);
  const [loading, setLoading] = useState(true);

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
      logger.error('Error fetching invitations:', { context: [error] });
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

  const getApprovalModeIcon = (mode: string) => {
    return mode === 'auto' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-600" />;
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

  if (invitations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
            <p className="text-gray-500">
              No invitations have been created for this chapter yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5 text-blue-600" />
            <span>Active Invitations</span>
            <Badge variant="secondary">{invitations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-medium text-gray-900">
                        Invitation #{invitation.token.slice(0, 8)}...
                      </h4>
                      {getStatusBadge(invitation)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {invitation.usage_count} uses
                          {invitation.max_uses && (
                            <span className="text-gray-500"> / {invitation.max_uses} max</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getApprovalModeIcon(invitation.approval_mode)}
                        <span className="text-gray-600">
                          {invitation.approval_mode === 'auto' ? 'Auto-approve' : 'Manual approval'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {invitation.expires_at 
                            ? `Expires ${formatDate(invitation.expires_at)}`
                            : 'No expiration'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {invitation.single_use ? 'Single-use per email' : 'Multiple uses per email'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">Open Invitation:</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Accepts any email address from any domain
                      </div>
                    </div>
                    
                    {invitation.usage.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Recent Usage:</span>
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {invitation.usage.slice(0, 3).map((usage) => (
                            <div key={usage.id} className="text-sm text-gray-600 flex items-center justify-between">
                              <span>{usage.user_name || usage.email}</span>
                              <span className="text-xs text-gray-500">{formatDate(usage.used_at)}</span>
                            </div>
                          ))}
                          {invitation.usage.length > 3 && (
                            <div className="text-sm text-gray-500 italic">
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
                      onClick={() => invitation.invitation_url && handleCopyLink(invitation.invitation_url)}
                      title="Copy invitation link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(invitation)}
                        title="Edit invitation"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(invitation.id)}
                        title="Delete invitation"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
