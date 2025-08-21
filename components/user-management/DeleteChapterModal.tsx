'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface Chapter {
  id: string;
  name: string;
  university: string;
  national_fraternity: string;
  member_count: number;
}

interface DeleteChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chapter: Chapter | null;
  isDeleting: boolean;
}

export function DeleteChapterModal({ isOpen, onClose, onConfirm, chapter, isDeleting }: DeleteChapterModalProps) {
  if (!isOpen || !chapter) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Chapter</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this chapter? This action cannot be undone.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">{chapter.name}</h4>
              <div className="text-sm text-red-700 space-y-1">
                <p><strong>University:</strong> {chapter.university}</p>
                <p><strong>National Fraternity:</strong> {chapter.national_fraternity}</p>
                <p><strong>Members:</strong> {chapter.member_count}</p>
              </div>
            </div>
            
            <p className="text-sm text-red-600 font-medium">
              ⚠️ This will permanently remove the chapter and all associated data.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex items-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Chapter</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
