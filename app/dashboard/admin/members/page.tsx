'use client';

import { useProfile } from '@/lib/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersTab } from '@/components/user-management/UsersTab';

export default function AdminMembersPage() {
  const { profile } = useProfile();

  if (!profile) return null;
  const isAdmin = profile.role === 'admin';
  const chapterId = profile.chapter_id || null;

  if (!isAdmin || !chapterId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Admin role and chapter required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Chapter Members</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <UsersTab
              chapterId={chapterId}
              chapterContext={{
                chapterId: chapterId,
                chapterName: profile.chapter || 'Current Chapter',
                isChapterAdmin: true
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


