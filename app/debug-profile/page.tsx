'use client';

import { useProfile } from '@/lib/hooks/useProfile';
import { ProfileService } from '@/lib/services/profileService';
import { useState } from 'react';

export default function DebugProfilePage() {
  const { profile, alumni, loading, error } = useProfile();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testProfileService = async () => {
    setTesting(true);
    try {
      console.log('Testing ProfileService.getCurrentProfileWithAlumni()...');
      const result = await ProfileService.getCurrentProfileWithAlumni();
      console.log('Test result:', result);
      setTestResult(result);
    } catch (err) {
      console.error('Test error:', err);
      setTestResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  };

  const testEnsureAlumniRecord = async () => {
    if (!profile) return;
    
    setTesting(true);
    try {
      console.log('Testing ProfileService.ensureAlumniRecord()...');
      const result = await ProfileService.ensureAlumniRecord(profile.id);
      console.log('Ensure alumni record result:', result);
      setTestResult({ ensureAlumniRecord: result });
    } catch (err) {
      console.error('Test error:', err);
      setTestResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current State */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Profile:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Alumni:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(alumni, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Profile Role:</h3>
              <p className="text-lg font-mono">{profile?.role || 'undefined'}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Is Alumni:</h3>
              <p className="text-lg font-mono">{profile?.role === 'Alumni' ? 'true' : 'false'}</p>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={testProfileService}
              disabled={testing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test ProfileService.getCurrentProfileWithAlumni()'}
            </button>
            
            <button
              onClick={testEnsureAlumniRecord}
              disabled={testing || !profile}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test ensureAlumniRecord()'}
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4">
              <h3 className="font-medium">Test Result:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Conditional Rendering Test */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Conditional Rendering Test</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Alumni Badge Test:</h3>
            <div className="mt-2">
              {profile?.role === 'Alumni' ? (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  ✓ Alumni Badge Should Show
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  ✗ Alumni Badge Should NOT Show (Role: {profile?.role || 'undefined'})
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Alumni Fields Test:</h3>
            <div className="mt-2">
              {profile?.role === 'Alumni' && alumni ? (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  ✓ Alumni Fields Should Show
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  ✗ Alumni Fields Should NOT Show
                  {profile?.role !== 'Alumni' && ` (Role: ${profile?.role || 'undefined'})`}
                  {profile?.role === 'Alumni' && !alumni && ' (No alumni data)'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 