'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { ChapterDocumentManager } from '../ChapterDocumentManager';

export function DocumentsView() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-600 mt-1">Manage chapter documents</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {chapterId && (
        <ChapterDocumentManager 
          chapterId={chapterId} 
          className="w-full"
        />
      )}
    </div>
  );
}

