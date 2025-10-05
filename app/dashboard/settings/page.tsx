'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Bell, ArrowLeft, ToggleLeft, ToggleRight, Mail, User, Phone, Calendar, Lock, User as UserIcon, HelpCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/hooks/useProfile';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('security');
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [chapterAnnouncements, setChapterAnnouncements] = useState(true);
  const [connectionRequests, setConnectionRequests] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Add these SMS-related state variables
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  // Mobile-specific state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();

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

      {/* SMS Notifications Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
        
        <div className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">SMS Text Messages</h4>
              <p className="text-sm text-gray-600">
                Receive important chapter updates and announcements via SMS
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>• Message and data rates may apply</p>
                <p>• Reply STOP to opt-out at any time</p>
                <p>• Reply HELP for help</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <span className="text-sm text-gray-500">
                {smsEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSmsEnabled(!smsEnabled)}
                className="p-0 h-auto"
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

        {/* SMS Phone Number Input */}
        {smsEnabled && (
          <div className="p-4 border rounded-xl bg-blue-50">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Phone Number for SMS
                </label>
                <input
                  type="tel"
                  value={smsPhone || ''}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your mobile phone number to receive SMS notifications
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="smsConsent"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="smsConsent" className="text-sm text-gray-700">
                  I consent to receive SMS messages from my chapter. I understand that message and data rates may apply, and I can reply STOP to opt-out at any time. By checking this box, I acknowledge that I have read and agree to the{' '}
                  <Link href="/sms-terms" className="text-blue-600 hover:underline">
                    SMS Terms of Service
                  </Link>.
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
        
        <div className="space-y-3">
          <div className="p-4 border rounded-xl bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Connection Requests</h4>
                <p className="text-sm text-gray-600">Get notified when someone wants to connect with you</p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-sm text-gray-500">
                  {connectionRequests ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConnectionRequests(!connectionRequests)}
                  className="p-0 h-auto"
                >
                  {connectionRequests ? (
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
                <h4 className="font-medium text-gray-900">Chapter Announcements</h4>
                <p className="text-sm text-gray-600">Receive updates from your chapter leadership</p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-sm text-gray-500">
                  {chapterAnnouncements ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChapterAnnouncements(!chapterAnnouncements)}
                  className="p-0 h-auto"
                >
                  {chapterAnnouncements ? (
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
                <h4 className="font-medium text-gray-900">Message Notifications</h4>
                <p className="text-sm text-gray-600">Get notified when you receive new messages</p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-sm text-gray-500">
                  {messageNotifications ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessageNotifications(!messageNotifications)}
                  className="p-0 h-auto"
                >
                  {messageNotifications ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
        
        <div className="p-4 border rounded-xl bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Browser Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications in your browser</p>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <span className="text-sm text-gray-500">
                {pushNotifications ? 'Enabled' : 'Disabled'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPushNotifications(!pushNotifications)}
                className="p-0 h-auto"
              >
                {pushNotifications ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSaveSettings}
          disabled={smsEnabled && (!smsPhone || !smsConsent)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Save Notification Preferences
        </Button>
      </div>
    </div>
  );

  const handleSaveSettings = async () => {
    try {
      // Here you would save the notification settings to your database
      // This would integrate with your NotificationSettings interface
      console.log('Saving notification settings:', {
        smsEnabled,
        smsPhone,
        smsConsent,
        emailNotifications,
        pushNotifications,
        chapterAnnouncements,
        connectionRequests,
        messageNotifications
      });
      
      // TODO: Implement API call to save settings
      // await saveNotificationSettings({...});
      
      alert('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

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
