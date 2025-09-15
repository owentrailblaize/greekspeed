'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvitationStats } from '@/types/invitations';

interface InviteSettingsProps {
  chapterId: string;
  onClose: () => void;
}

export function InviteSettings({ chapterId, onClose }: InviteSettingsProps) {
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/invitations/stats?chapter_id=${chapterId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const statsData = await response.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching invitation stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [chapterId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Invitation Settings & Statistics</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Statistics Overview */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : stats ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span>Invitation Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.total_invitations}</div>
                    <div className="text-sm text-gray-600">Total Invitations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.active_invitations}</div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total_usage}</div>
                    <div className="text-sm text-gray-600">Total Signups</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.pending_approvals}</div>
                    <div className="text-sm text-gray-600">Pending Approval</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Information Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span>How Invitations Work</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Single-Use Per Email</h4>
                  <p className="text-sm text-gray-600">
                    Each email address can only use each invitation link once. This prevents duplicate signups while allowing multiple people to use the same invitation with different emails.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Approval Modes</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Auto-approve</Badge>
                      <span className="text-sm text-gray-600">Immediate access after signup</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Manual approval</Badge>
                      <span className="text-sm text-gray-600">Requires admin approval before access</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Open Email Access</h4>
                  <p className="text-sm text-gray-600">
                    All invitations accept any email address from any domain. This allows maximum flexibility for chapter members to join using their preferred email address.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Security Best Practices</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Invitation Security</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Each invitation generates a unique, secure token</li>
                    <li>Invitations can be deactivated at any time</li>
                    <li>Usage is tracked to prevent abuse</li>
                    <li>Expiration dates help limit exposure</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Set reasonable expiration dates for invitations</li>
                    <li>Monitor invitation usage regularly</li>
                    <li>Deactivate unused invitations periodically</li>
                    <li>Use single-use per email to prevent duplicate signups</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5 text-green-600" />
                  <span>Workflow Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Step-by-Step Process</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Admin creates an invitation with desired settings</li>
                    <li>System generates a secure invitation link</li>
                    <li>Admin shares the same link with multiple chapter members</li>
                    <li>Each member follows the link and signs up with their unique email</li>
                    <li>System validates the invitation and creates their account</li>
                    <li>Member is assigned to the chapter with appropriate role and status</li>
                  </ol>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Key Point:</strong> One invitation link can be used by multiple people with different email addresses, but each email can only use each invitation once.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
