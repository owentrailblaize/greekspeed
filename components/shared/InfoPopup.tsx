import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Building2, TrendingUp, Users, MapPin, Calendar, Globe, Star, Clock } from 'lucide-react';

interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'company' | 'industry' | 'chapter';
  entityId: string;
  entityName: string;
}

export function InfoPopup({ isOpen, onClose, entityType, entityId, entityName }: InfoPopupProps) {
  if (!isOpen) return null;

  const renderCompanyContent = () => (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{entityName}</h3>
          <p className="text-gray-600">Company</p>
          <div className="flex items-center space-x-2 mt-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Location information coming soon</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Feature Coming Soon</span>
        </div>
        <p className="text-blue-700 text-sm">
          Rich company information including industry details, employee count, founding year, 
          website, and more will be available soon. This will include data from reliable sources 
          to provide comprehensive company insights.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Employee count coming soon</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Founded year coming soon</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Website information coming soon</span>
        </div>
      </div>
    </div>
  );

  const renderIndustryContent = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">{entityName}</h3>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Feature Coming Soon</span>
        </div>
        <p className="text-blue-700 text-sm">
          Industry insights including market size, growth rate, key trends, and related industries 
          will be available soon. This will provide valuable market intelligence for networking 
          and career decisions.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Market Overview</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Market Size:</span>
              <span className="text-sm text-gray-400">Coming soon</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Growth Rate:</span>
              <span className="text-sm text-gray-400">Coming soon</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Key Trends</h4>
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs text-gray-400">Trends coming soon</Badge>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChapterContent = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Users className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">{entityName}</h3>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Feature Coming Soon</span>
        </div>
        <p className="text-blue-700 text-sm">
          Chapter information including member count, location, founding year, upcoming events, 
          and recent achievements will be available soon. This will help strengthen chapter 
          connections and engagement.
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Location coming soon</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Member count coming soon</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Founded year coming soon</span>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Upcoming Events</h4>
        <div className="space-y-1">
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>Event information coming soon</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-900 mb-2">Recent Achievements</h4>
        <div className="space-y-1">
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>Achievement information coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (entityType) {
      case 'company':
        return renderCompanyContent();
      case 'industry':
        return renderIndustryContent();
      case 'chapter':
        return renderChapterContent();
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Information
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
