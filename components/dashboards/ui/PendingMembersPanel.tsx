'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

interface PendingMember {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  created_at: string;
  chapter_id: string;
}

interface PendingMembersPanelProps {
  chapterId: string;
}

export function PendingMembersPanel({ chapterId }: PendingMembersPanelProps) {
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingMembers = async () => {
    try {
      const response = await fetch(`/api/chapter/pending-members?chapter_id=${chapterId}`);
      if (response.ok) {
        const data = await response.json();
        setPendingMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching pending members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMembers();
  }, [chapterId]);

  const handleApprove = async (memberId: string) => {
    setProcessing(memberId);
    try {
      const response = await fetch('/api/chapter/approve-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, chapterId })
      });

      if (response.ok) {
        toast.success('Member approved successfully!');
        fetchPendingMembers(); // Refresh the list
      } else {
        throw new Error('Failed to approve member');
      }
    } catch (error) {
      toast.error('Failed to approve member');
      console.error('Error approving member:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (memberId: string) => {
    setProcessing(memberId);
    try {
      const response = await fetch('/api/chapter/decline-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, chapterId })
      });

      if (response.ok) {
        toast.success('Member declined successfully!');
        fetchPendingMembers(); // Refresh the list
      } else {
        throw new Error('Failed to decline member');
      }
    } catch (error) {
      toast.error('Failed to decline member');
      console.error('Error declining member:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-orange-600" />
            <span>Pending Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-orange-600" />
          <span>Pending Members</span>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {pendingMembers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingMembers.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No pending members at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{member.full_name}</h4>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500">
                    Joined: {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Pending
                  </Badge>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDecline(member.id)}
                      disabled={processing === member.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(member.id)}
                      disabled={processing === member.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
