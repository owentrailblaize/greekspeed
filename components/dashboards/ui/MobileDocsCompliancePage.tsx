'use client';

import { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, Clock, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/hooks/useProfile';

interface Document {
  id: string;
  name: string;
  type: 'bylaws' | 'financial' | 'compliance' | 'insurance' | 'roster';
  status: 'current' | 'expired' | 'pending' | 'missing';
  lastUpdated: string;
  dueDate?: string;
  uploadedBy: string;
}

export function MobileDocsCompliancePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'current' | 'expired' | 'pending' | 'missing'>('all');
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Mock documents data - replace with actual API call
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Chapter Bylaws',
        type: 'bylaws',
        status: 'current',
        lastUpdated: '2024-01-01',
        uploadedBy: 'Secretary'
      },
      {
        id: '2',
        name: 'Financial Audit Report',
        type: 'financial',
        status: 'expired',
        lastUpdated: '2023-06-01',
        dueDate: '2024-01-15',
        uploadedBy: 'Treasurer'
      },
      {
        id: '3',
        name: 'Insurance Certificate',
        type: 'insurance',
        status: 'pending',
        lastUpdated: '2023-12-01',
        dueDate: '2024-01-20',
        uploadedBy: 'Risk Manager'
      },
      {
        id: '4',
        name: 'Member Roster',
        type: 'roster',
        status: 'current',
        lastUpdated: '2024-01-10',
        uploadedBy: 'Membership Chair'
      },
      {
        id: '5',
        name: 'Compliance Checklist',
        type: 'compliance',
        status: 'missing',
        lastUpdated: '2023-09-01',
        dueDate: '2024-01-25',
        uploadedBy: 'Compliance Officer'
      }
    ];

    setTimeout(() => {
      setDocuments(mockDocuments);
      setLoading(false);
    }, 1000);
  }, [chapterId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'text-green-600 bg-green-50';
      case 'expired': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'missing': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return CheckCircle;
      case 'expired': return AlertCircle;
      case 'pending': return Clock;
      case 'missing': return AlertCircle;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bylaws': return 'Bylaws';
      case 'financial': return 'Financial';
      case 'compliance': return 'Compliance';
      case 'insurance': return 'Insurance';
      case 'roster': return 'Roster';
      default: return type;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (activeFilter === 'all') return true;
    return doc.status === activeFilter;
  });

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: documents.length },
    { id: 'current' as const, label: 'Current', count: documents.filter(d => d.status === 'current').length },
    { id: 'expired' as const, label: 'Expired', count: documents.filter(d => d.status === 'expired').length },
    { id: 'pending' as const, label: 'Pending', count: documents.filter(d => d.status === 'pending').length },
    { id: 'missing' as const, label: 'Missing', count: documents.filter(d => d.status === 'missing').length }
  ];

  const handleUpload = (docId: string) => {
    console.log(`Upload document: ${docId}`);
    // Implement upload functionality
  };

  const handleDownload = (docId: string) => {
    console.log(`Download document: ${docId}`);
    // Implement download functionality
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Documents & Compliance</h1>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterButtons.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {activeFilter === 'all' ? 'No documents found' : `No ${activeFilter} documents`}
            </p>
            <p className="text-gray-400 text-sm">
              {activeFilter === 'all' ? 'Upload your first document to get started!' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredDocuments.map((doc, index) => {
              const StatusIcon = getStatusIcon(doc.status);
              return (
                <div 
                  key={doc.id} 
                  className={`px-4 py-4 ${index !== filteredDocuments.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <StatusIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{doc.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">{getTypeLabel(doc.type)}</p>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due: {new Date(doc.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>Updated: {new Date(doc.lastUpdated).toLocaleDateString()}</span>
                        <span>By: {doc.uploadedBy}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleUpload(doc.id)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
