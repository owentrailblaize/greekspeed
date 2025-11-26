'use client';

import { ExternalLink, Globe } from 'lucide-react';
import type { LinkPreview } from '@/types/posts';
import { useState } from 'react';

interface LinkPreviewCardProps {
  preview: LinkPreview;
  className?: string;
  hideImage?: boolean; // If true, don't show the preview image (compact mode)
}

export function LinkPreviewCard({ 
  preview, 
  className = '', 
  hideImage = false 
}: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(preview.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`block rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      {/* Only show image if hideImage is false AND image exists */}
      {!hideImage && preview.image && !imageError && (
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          {/* Use regular img tag for external images to avoid Next.js domain whitelisting */}
          <img
            src={preview.image}
            alt={preview.title || 'Link preview'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className="p-4">
        {preview.siteName && (
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              {preview.siteName}
            </span>
          </div>
        )}
        
        {preview.title && (
          <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
            {preview.title}
          </h4>
        )}
        
        {preview.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {preview.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{preview.url}</span>
        </div>
      </div>
    </a>
  );
}

