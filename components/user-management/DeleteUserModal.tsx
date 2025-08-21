'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: {
    email: string;
    full_name: string | null;
    role: string | null;
    chapter: string | null;
  } | null;
  isDeleting: boolean;
}

export function DeleteUserModal({ isOpen, onClose, onConfirm, user, isDeleting }: DeleteUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete User</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete "{user.full_name || user.email}"?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </p>
          </div>

          {/* User Details */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            {user.full_name && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{user.full_name}</span>
              </div>
            )}
            {user.role && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>
              </div>
            )}
            {user.chapter && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chapter:</span>
                <span className="font-medium">{user.chapter}</span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">This will permanently:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Delete their profile from the database</li>
                  <li>Delete their authentication account</li>
                  <li>Remove all associated data and connections</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete User</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
