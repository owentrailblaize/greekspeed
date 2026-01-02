'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowLeft, Search, Filter, X } from 'lucide-react';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { useAuth } from '@/lib/supabase/auth-context';

export default function ManageConnectionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { connections, loading } = useConnections();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  const getConnectionPartner = (connection: any) => {
    if (!user) return { name: 'Unknown', initials: 'U', avatar: null };
    const partner = connection.requester_id === user.id ? connection.recipient : connection.requester;
    return {
      name: partner.full_name || 'Unknown User',
      initials: partner.full_name?.charAt(0) || 'U',
      avatar: partner.avatar_url
    };
  };

  // Filter and sort connections
  const filteredConnections = useMemo(() => {
    if (!connections || !user) return [];

    let filtered = connections.filter(conn => {
      const partner = getConnectionPartner(conn);
      const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = conn.status === 'pending' && conn.recipient_id === user.id;
      } else if (statusFilter === 'sent') {
        matchesStatus = conn.status === 'pending' && conn.requester_id === user.id;
      } else if (statusFilter === 'connected') {
        matchesStatus = conn.status === 'accepted';
      } else if (statusFilter === 'declined') {
        matchesStatus = conn.status === 'declined';
      }

      return matchesSearch && matchesStatus;
    });

    // Sort connections
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      } else if (sortBy === 'name') {
        const partnerA = getConnectionPartner(a);
        const partnerB = getConnectionPartner(b);
        return partnerA.name.localeCompare(partnerB.name);
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });

    return filtered;
  }, [connections, user, searchTerm, statusFilter, sortBy]);

  const getStatusBadge = (connection: any) => {
    if (!user) return null;
    
    if (connection.status === 'pending') {
      if (connection.recipient_id === user.id) {
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      } else {
        return <Badge variant="outline" className="text-xs">Sent</Badge>;
      }
    } else if (connection.status === 'accepted') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Connected</Badge>;
    } else if (connection.status === 'declined') {
      return <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Declined</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600" />
            <span className="ml-2 text-gray-600">Loading connections...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => router.push('/dashboard/alumni')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Manage my network</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter} placeholder="Status">
            <SelectTrigger className="flex-1 h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Connections</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy} placeholder="Sort by">
            <SelectTrigger className="flex-1 h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Connections List */}
      <div className="px-4 py-4">
        {filteredConnections.length > 0 ? (
          <div className="space-y-3">
            {filteredConnections.map((connection) => {
              const partner = getConnectionPartner(connection);
              return (
                <div
                  key={connection.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold flex-shrink-0">
                      {partner.avatar ? (
                        <img 
                          src={partner.avatar} 
                          alt={partner.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        partner.initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {partner.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {connection.status === 'accepted' 
                          ? `Connected ${new Date(connection.updated_at).toLocaleDateString()}`
                          : new Date(connection.created_at).toLocaleDateString()
                        }
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(connection)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-base font-medium mb-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'No connections found' 
                : 'No connections yet'
              }
            </p>
            <p className="text-gray-500 text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start connecting with chapter members'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

