'use client';

import { PersonalAlumniProfile } from './PersonalAlumniProfile';

export function MobileProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        </div>

        {/* Personal Alumni Profile */}
        <PersonalAlumniProfile />
      </div>
    </div>
  );
}
