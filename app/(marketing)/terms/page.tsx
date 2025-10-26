'use client';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <MarketingHeader />
      
      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Centered Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Our User Agreements &<br/> Terms of Service
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

        {/* Terms Content - Plain Text */}
        <div className="space-y-2 text-gray-700 leading-relaxed">
          <p>
            These Terms and Conditions ("Terms") govern your use of Trailblaize, Inc.'s services ("Trailblaize," "we," "our," "us"). By creating an account or using Trailblaize, you agree to these Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">1. Use of Services</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>You must be a current member, alumnus, or authorized user of a participating chapter to access Trailblaize.</li>
            <li>You agree to provide accurate account information and keep it up to date.</li>
            <li>You may not use Trailblaize for unlawful, harmful, or unauthorized purposes.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">2. Accounts and Security</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>You are responsible for maintaining the confidentiality of your login information.</li>
            <li>You are responsible for all activity under your account.</li>
            <li>Notify us immediately if you suspect unauthorized use of your account.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">3. Communications</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-bold text-yellow-800 mb-2">Important: Communication Terms</p>
            <ul className="list-disc list-inside ml-4 text-yellow-800 space-y-1">
              <li>By creating an account, you agree to receive communications from Trailblaize via email.</li>
              <li><strong>SMS communications are optional</strong> and require separate consent.</li>
              <li>You may unsubscribe from emails by using the unsubscribe link and from SMS by replying STOP.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">4. Intellectual Property</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>All content and technology within Trailblaize is owned or licensed by Trailblaize, Inc.</li>
            <li>You may not copy, modify, or distribute Trailblaize content without permission.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">5. Limitation of Liability</h2>
          <p>
            Trailblaize is provided "as is." To the fullest extent permitted by law, Trailblaize is not liable for damages arising from your use of the platform, including lost data, service interruptions, or unauthorized access.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">6. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these Terms or misuse the platform.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">7. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">8. Contact Us</h2>
          <p>
            <strong>Trailblaize, Inc.</strong><br />
            1111B South Governors Avenue<br />
            Dover, DE 19904<br />
            <a href="mailto:support@trailblaize.net" className="text-blue-600 hover:underline">support@trailblaize.net</a>
          </p>
        </div>
      </div>
    </div>
  );
}
