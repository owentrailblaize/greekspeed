'use client';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <MarketingHeader />
      
      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Centered Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Understand Your Privacy Rights and Data Options
          </h1>
        </div>

        {/* Last Updated */}
        <p className="text-gray-600 mb-8">
          Last Updated: October 3rd, 2025
        </p>

        {/* Google API Disclosure Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Google API Disclosure</h2>
          <p className="text-gray-700">
            Trailblaize's use of information received from Google APIs will adhere to{' '}
            <a 
              href="https://developers.google.com/terms/api-services-user-data-policy" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-semibold"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </div>

        {/* Policy Content - Plain Text */}
        <div className="space-y-2 text-gray-700 leading-relaxed">
          <p>
            Trailblaize, Inc. ("Trailblaize," "we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information, including phone numbers provided for messaging.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">Information We Collect</h2>
          <p><strong>Account Information:</strong> Name, email address, phone number, and chapter affiliation when you sign up for Trailblaize.</p>
          <p><strong>Usage Information:</strong> Data about how you use the Trailblaize platform (e.g., logins, features accessed).</p>
          <p><strong>Communications:</strong> SMS messages and emails sent through Trailblaize (e.g., announcements, reminders).</p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Provide access to Trailblaize's chapter management tools.</li>
            <li>Send chapter announcements and reminders via SMS and email.</li>
            <li>Respond to support requests.</li>
            <li>Improve the platform and develop new features.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">SMS Messaging</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-bold text-yellow-800 mb-2">Important: SMS Consent and Usage</p>
            <ul className="list-disc list-inside ml-4 text-yellow-800 space-y-1">
              <li>By providing your phone number, you agree to receive SMS messages related to chapter operations (announcements, reminders, schedules).</li>
              <li>Message frequency varies by chapter activity.</li>
              <li>Standard message and data rates may apply.</li>
              <li>You may opt out at any time by replying STOP to any message. Reply HELP for assistance.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">How We Share Information</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>We do not sell your personal information.</li>
            <li>We may share limited data with trusted service providers (such as Twilio for SMS delivery) only to provide Trailblaize services.</li>
            <li>We may disclose information if required by law.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">Data Security</h2>
          <p>We use industry-standard measures to protect your information from unauthorized access or disclosure.</p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">Your Choices</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>Opt-Out of SMS:</strong> Reply STOP to unsubscribe from text messages.</li>
            <li><strong>Email Preferences:</strong> You may unsubscribe from non-essential emails at any time.</li>
            <li><strong>Account Deletion:</strong> Contact support@trailblaize.net to request deletion of your account and data.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">Contact Us</h2>
          <p>If you have questions about this Privacy Policy, contact us:</p>
          <p>
            <strong>Trailblaize, Inc.</strong><br />
            1111B South Governors Avenue, Dover, DE 19904<br />
            Email: <a href="mailto:support@trailblaize.net" className="text-blue-600 hover:underline">support@trailblaize.net</a>
          </p>
        </div>
      </div>
    </div>
  );
}
