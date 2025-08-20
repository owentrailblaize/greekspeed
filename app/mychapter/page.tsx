"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddMemberForm } from '@/components/chapter/AddMemberForm';

export default function MyChapterPage() {
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  console.log('showAddMemberForm:', showAddMemberForm);
  console.log('Page rendering normally');

  return (
    <div>
      {/* Add Member Button */}
      <Button onClick={() => setShowAddMemberForm(true)}>
        Add Member
      </Button>

      {/* Add Member Modal */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddMemberForm
            onClose={() => setShowAddMemberForm(false)}
            onSuccess={() => {
              setShowAddMemberForm(false);
              // Refresh member list
            }}
          />
        </div>
      )}
    </div>
  );
}