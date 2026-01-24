'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Bell, ArrowLeft, ToggleLeft, ToggleRight, Mail, User, Phone, Calendar, Lock, User as UserIcon, HelpCircle, Menu, X, BellOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { ChangePasswordForm } from '@/components/features/settings/ChangePasswordForm';
import { useOneSignal } from '@/lib/hooks/useOneSignal';
import { OneSignalService } from '@/lib/services/push/oneSignalService';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('security');
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [chapterAnnouncements, setChapterAnnouncements] = useState(true);
  const [connectionRequests, setConnectionRequests] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState({
    announcement_notifications: true,
    event_notifications: true,
    event_reminder_notifications: true,
    message_notifications: true,
    connection_notifications: true,
  });
  
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    const checkOneSignal = async () => {
      if (typeof window !== 'undefined' && window.OneSignal) {
        setOneSignalReady(true);
      } else {
        // Wait for OneSignal to initialize
        let attempts = 0;
        const maxAttempts = 10;
        
        const interval = setInterval(() => {
          attempts++;
          if (window.OneSignal) {
            setOneSignalReady(true);
            clearInterval(interval);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            console.warn('⚠️ OneSignal failed to initialize after 5 seconds');
          }
        }, 500);
        
        return () => clearInterval(interval);
      }
    };
    
    checkOneSignal();
  }, []);

  // Helper to PATCH only changed fields
  const updateEmailSettings = async (payload:Partial<typeof emailPrefs> & { email_enabled?: boolean }) => {
    if (!profile?.id) return;
    setEmailPrefsLoading(true);
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, ...payload }),
      });
      if (!res.ok) throw new Error('Failed to update email settings');
    } finally {
      setEmailPrefsLoading(false);
    }
  };
  
  // Mobile-specific state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // SMS notification state - SIMPLIFIED to just one toggle
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Push notification state
  const { 
    subscription: pushSubscription, 
    loading: pushLoading, 
    requestPermission, 
    subscribe, 
    unsubscribe,
    isSupported: pushSupported 
  } = useOneSignal();
  const [pushEnabled, setPushEnabled] = useState(false);

  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();

  // Sync pushEnabled with subscription state
  useEffect(() => {
    setPushEnabled(pushSubscription.isSubscribed && pushSubscription.permission === 'granted');
  }, [pushSubscription]);

  // Fetch notification settings on mount
  useEffect(() => {
    if (profile?.id) {
      fetchNotificationSettings(profile.id);
    }
  }, [profile?.id]);

  const fetchNotificationSettings = async (userId: string) => {
    try {
      setLoadingSettings(true);
      const response = await fetch(`/api/notifications/settings?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        // Explicitly check for boolean true (not just truthy)
        const smsEnabled = data.sms_enabled === true;
        console.log('📋 Settings loaded:', { 
          sms_enabled: data.sms_enabled, 
          parsed: smsEnabled,
          type: typeof data.sms_enabled 
        });
        setSmsEnabled(smsEnabled);

        setEmailEnabled(data.email_enabled === true);
        setEmailPrefs({
          announcement_notifications: data.announcement_notifications === true,
          event_notifications: data.event_notifications === true,
          event_reminder_notifications: data.event_reminder_notifications === true,
          message_notifications: data.message_notifications === true,
          connection_notifications: data.connection_notifications === true,
        })
      } else {
        console.error('Failed to fetch settings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSMSEnabledToggle = async (value: boolean) => {
    if (!profile?.id) return;
    
    // Optimistically update UI
    setSmsEnabled(value);
    
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          sms_enabled: value
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      const result = await response.json();
      console.log('✅ SMS preference updated:', result);
    } catch (error) {
      console.error('Error updating notification setting:', error);
      // Revert on error
      setSmsEnabled(!value);
      // You could add a toast notification here
    }
  };

  // Push notification toggle handler
  const handlePushToggle = async (value: boolean) => {
    if (!profile?.id) {
      alert('Please log in to enable push notifications');
      return;
    }
  
    // Optimistically update UI
    const previousState = pushEnabled;
    setPushEnabled(value);

    try {
      // Wait for OneSignal to be ready
      if (typeof window === 'undefined' || !window.OneSignal) {
        console.log('⏳ Waiting for OneSignal to initialize...');
        // Wait up to 5 seconds for OneSignal to initialize
        let attempts = 0;
        while (!window.OneSignal && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.OneSignal) {
          throw new Error('OneSignal failed to initialize. Please refresh the page and try again.');
        }
      }

      if (value) {
        // Check if OneSignal is supported
        if (!pushSupported) {
          throw new Error('Push notifications are not supported in this browser');
        }

        // Request permission first (must be triggered by user action)
        console.log('🔔 Requesting push notification permission...');
        
        try {
          const permission = await requestPermission();
          console.log('📋 Permission result:', permission);
          
          if (permission === 'granted') {
            console.log('✅ Permission granted, subscribing...');
            
            // Subscribe and get subscription details
            await subscribe();
            const sub = await OneSignalService.getSubscription();
            
            if (sub.playerId) {
              console.log('📱 Saving subscription to backend:', sub.playerId);
              
              // Save to backend
              const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  playerId: sub.playerId,
                  subscriptionToken: sub.token,
                  deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                  },
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to save subscription');
              }

              const result = await response.json();
              console.log('✅ Push notification subscription saved:', result);
              setPushEnabled(true);
            } else {
              throw new Error('Failed to get Player ID from OneSignal');
            }
          } else if (permission === 'denied') {
            alert('Push notifications were blocked. Please enable them in your browser settings (Settings → Privacy → Site Settings → Notifications).');
            setPushEnabled(false);
          } else {
            // Default state - user dismissed prompt
            console.log('ℹ️ User dismissed permission prompt');
            setPushEnabled(false);
          }
        } catch (permError) {
          console.error('❌ Permission request error:', permError);
          throw new Error(`Failed to request permission: ${permError instanceof Error ? permError.message : 'Unknown error'}`);
        }
      } else {
        // Unsubscribe
        console.log('🔕 Unsubscribing from push notifications...');
        const sub = await OneSignalService.getSubscription();
        
        if (sub.playerId) {
          const response = await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: sub.playerId }),
          });

          if (!response.ok) {
            console.warn('⚠️ Failed to delete subscription from backend, but unsubscribing locally');
          }
        }
        
        await unsubscribe();
        setPushEnabled(false);
        console.log('✅ Push notifications disabled');
      }
    } catch (error) {
      console.error('❌ Error toggling push notifications:', error);
      
      // Revert UI state on error
      setPushEnabled(previousState);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update push notification settings. Please try again.';
      
      alert(`Error: ${errorMessage}`);
    }
  };

  // Master Email Toggle
  const handleEmailEnabledToggle = async (value: boolean) => {
    setEmailEnabled(value);
    await updateEmailSettings({ email_enabled: value });
  };  

  // Individual Email Preferences
  const togglePref = async (key: keyof typeof emailPrefs) => {
    if (!emailEnabled) return;
    const next = { ...emailPrefs, [key]: !emailPrefs[key]};
    setEmailPrefs(next);
    await updateEmailSettings({ [key]: next[key] });
  };

  const sidebarItems = [
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Password and security settings',
      mobileDescription: 'Password & security',
      locked: false
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Notification preferences',
      mobileDescription: 'Notification preferences',
      locked: false
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      description: 'Account management & data',
      mobileDescription: 'Account management',
      locked: true
    },
    {
      id: 'support',
      label: 'Support',
      icon: HelpCircle,
      description: 'Help & support center',
      mobileDescription: 'Help & support',
      locked: true
    }
  ];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const handleBackToSecurity = () => {
    setActiveSubSection(null);
  };

  const handlePasswordChangeSuccess = () => {
    setActiveSubSection(null);
  };

  // Mobile-specific handlers
  const handleMobileSectionSelect = (sectionId: string) => {
    setActiveSection(sectionId);
    setShowMobileMenu(false);
  };

  const handleMobileBack = () => {
    if (activeSubSection) {
      setActiveSubSection(null);
    } else {
      router.back();
    }
  };

  const renderSecurityContent = () => {
    // Show change password form if that's the active sub-section
    if (activeSubSection === 'change-password') {
      return (
        <ChangePasswordForm
          showBackButton={true}
          onBack={handleBackToSecurity}
          onSuccess={handlePasswordChangeSuccess}
        />
      );
    }

    // Default security content
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
          <p className="text-gray-600">Manage your account security and privacy settings</p>
        </div>

        {/* Account Information - Mobile optimized */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
          
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center space-x-4 p-4 border rounded-xl bg-gray-50">
              <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Email Address</p>
                <p className="text-sm text-gray-600 truncate">{profile?.email || 'Not provided'}</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex items-center space-x-4 p-4 border rounded-xl bg-gray-50">
              <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Full Name</p>
                <p className="text-sm text-gray-600 truncate">{profile?.full_name || 'Not provided'}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center space-x-4 p-4 border rounded-xl bg-gray-50">
              <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Phone Number</p>
                <p className="text-sm text-gray-600 truncate">{profile?.phone || 'Not provided'}</p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-center space-x-4 p-4 border rounded-xl bg-gray-50">
              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Member Since</p>
                <p className="text-sm text-gray-600 truncate">
                  {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Actions - Mobile optimized */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Security Actions</h3>
          
          <div className="space-y-3">
            {/* Password Change - Mobile friendly */}
            <div className="p-4 border rounded-xl bg-white">
              <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-600 mt-1">Set a unique password for better protection</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setActiveSubSection('change-password')}
                  className="w-full lg:w-auto mt-3 lg:mt-0"
                >
                  Change Password
                </Button>
              </div>
            </div>

            {/* Two-Factor Authentication - Mobile friendly */}
            <div className="p-4 border rounded-xl bg-gray-50 opacity-50">
              <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
                </div>
                <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-3 mt-3 lg:mt-0">
                  <span className="text-sm text-gray-500 lg:order-1">Disabled</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled 
                    className="opacity-50 cursor-not-allowed w-full lg:w-auto order-2 lg:order-3"
                  >
                    Enable 2FA
                  </Button>
                  <Lock className="w-4 h-4 text-gray-400 order-1 lg:order-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationsContent = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-gray-600">Control how and when you receive notifications</p>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>

        {/* Master Toggle */}
        <div className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Enable Email Notifications</h4>
              <p className="text-sm text-gray-600">Turn all email notifications on or off</p>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <span className="text-sm text-gray-500">{emailEnabled ? 'Enabled' : 'Disabled'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEmailEnabledToggle(!emailEnabled)}
                className="p-0 h-auto"
                disabled={emailPrefsLoading}
              >
                {emailEnabled ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Sub-toggles, disabled if master off */}
        {emailEnabled && (
          <div className="space-y-3">
            <div className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Announcements</h4>
                  <p className="text-sm text-gray-600">Receive chapter announcements</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-500">
                    {emailPrefs.announcement_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePref('announcement_notifications')}
                    className="p-0 h-auto"
                    disabled={emailPrefsLoading}
                  >
                    {emailPrefs.announcement_notifications ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Events</h4>
                  <p className="text-sm text-gray-600">Get notified about new events</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-500">
                    {emailPrefs.event_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePref('event_notifications')}
                    className="p-0 h-auto"
                    disabled={emailPrefsLoading}
                  >
                    {emailPrefs.event_notifications ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Event Reminders</h4>
                  <p className="text-sm text-gray-600">Receive reminders for upcoming events</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-500">
                    {emailPrefs.event_reminder_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePref('event_reminder_notifications')}
                    className="p-0 h-auto"
                    disabled={emailPrefsLoading}
                  >
                    {emailPrefs.event_reminder_notifications ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Messages</h4>
                  <p className="text-sm text-gray-600">Get notified when you receive new messages</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-500">
                    {emailPrefs.message_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePref('message_notifications')}
                    className="p-0 h-auto"
                    disabled={emailPrefsLoading}
                  >
                    {emailPrefs.message_notifications ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Connections</h4>
                  <p className="text-sm text-gray-600">Notify me about requests and accepted connections</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="text-sm text-gray-500">
                    {emailPrefs.connection_notifications ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePref('connection_notifications')}
                    className="p-0 h-auto"
                    disabled={emailPrefsLoading}
                  >
                    {emailPrefs.connection_notifications ? (
                      <ToggleRight className="w-8 h-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SMS Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          SMS Notifications
        </h3>
        
        {/* Single SMS Toggle */}
        <div className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Enable SMS Notifications</h4>
              <p className="text-sm text-gray-600">Receive SMS notifications for events, messages, and connections</p>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <span className="text-sm text-gray-500">
                {smsEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSMSEnabledToggle(!smsEnabled)}
                className="p-0 h-auto"
                disabled={loadingSettings}
              >
                {smsEnabled ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      {pushSupported && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {pushEnabled ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            Push Notifications
          </h3>
          
          <div className="p-4 border rounded-xl bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Enable Push Notifications</h4>
                <p className="text-sm text-gray-600">
                  {pushEnabled 
                    ? 'Receive push notifications on your device' 
                    : pushSubscription.permission === 'denied'
                    ? 'Notifications blocked. Enable in browser settings.'
                    : 'Get real-time notifications on your device'}
                </p>
                {pushSubscription.playerId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Player ID: {pushSubscription.playerId.substring(0, 20)}...
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-sm text-gray-500">
                  {pushEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePushToggle(!pushEnabled)}
                  className="p-0 h-auto"
                  disabled={pushLoading}
                >
                  {pushEnabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Loading state with responsive design
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        {/* Desktop Loading */}
        <div className="hidden lg:block">
          <div className="max-w-full mx-auto px-14 py-6">
            <div className="flex gap-6">
              <div className="w-72 flex-shrink-0">
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="space-y-4">
                      <div className="h-20 bg-gray-200 rounded"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Loading */}
        <div className="lg:hidden">
          <div className="animate-pulse space-y-4 p-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Desktop Layout - Unchanged */}
      <div className="hidden lg:block">
        <div className="max-w-full mx-auto px-14 py-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0">
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="w-full justify-start mb-4 text-gray-600 hover:text-gray-900 rounded-full"
                    style={{ borderRadius: '100px' }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <CardTitle className="text-lg text-gray-900">Settings</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <nav className="space-y-2">
                    {sidebarItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => !item.locked && setActiveSection(item.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.locked
                              ? 'text-gray-400 cursor-not-allowed opacity-50'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          disabled={item.locked}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </div>
                          {item.locked && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-8">
                {activeSection === 'security' && renderSecurityContent()}
                {activeSection === 'notifications' && renderNotificationsContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMobileBack}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {activeSubSection ? 'Security Settings' : 'Settings'}
              </h1>
            </div>
            
            {!activeSubSection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
            <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !item.locked && handleMobileSectionSelect(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                          activeSection === item.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.locked
                            ? 'text-gray-400 cursor-not-allowed opacity-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        disabled={item.locked}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-gray-500 leading-tight">{item.mobileDescription || item.description}</div>
                          </div>
                        </div>
                        {item.locked && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content - Moderate padding from edges */}
        <div className="px-6 py-6 pb-8">
          {activeSection === 'security' && (
            <div>
              {renderSecurityContent()}
            </div>
          )}
          {activeSection === 'notifications' && (
            <div>
              {renderNotificationsContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
