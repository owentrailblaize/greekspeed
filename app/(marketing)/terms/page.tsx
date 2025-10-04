'use client';
import { MarketingHeader } from '@/components/MarketingHeader';

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
            Welcome to Trailblaize, Inc. ("Trailblaize," "we," "our," "us"). These Terms of Service ("Terms") govern your use of our platform and services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Trailblaize's services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use our services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">2. Description of Service</h2>
          <p>
            Trailblaize provides a comprehensive platform for Greek organizations to manage chapter operations, connect with alumni, process dues, and coordinate events. Our services include but are not limited to member management, alumni networking, financial tracking, and communication tools.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">3. User Accounts</h2>
          <p>
            To access certain features of our service, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">4. Acceptable Use</h2>
          <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You may not:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Use the service for any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>Violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>Transmit or procure the sending of any advertising or promotional material without our prior written consent</li>
            <li>Impersonate or attempt to impersonate Trailblaize, a Trailblaize employee, another user, or any other person or entity</li>
            <li>Engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the service</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">5. SMS and Communication Consent</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-bold text-yellow-800 mb-2">Important: SMS Communication Terms</p>
            <ul className="list-disc list-inside ml-4 text-yellow-800 space-y-1">
              <li>By providing your phone number, you consent to receive SMS messages from Trailblaize regarding your chapter membership and our services</li>
              <li>Message frequency varies by chapter activity and your preferences</li>
              <li>Standard message and data rates may apply according to your mobile carrier plan</li>
              <li>You may opt out at any time by replying "STOP" to any message</li>
              <li>Reply "HELP" to any message for assistance or contact support@trailblaize.net</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">6. Payment Terms</h2>
          <p>
            Certain features of our service may require payment. All fees are non-refundable unless otherwise stated. You are responsible for all applicable taxes and fees associated with your use of our service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">7. Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are and will remain the exclusive property of Trailblaize, Inc. and its licensors. The service is protected by copyright, trademark, and other laws.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">8. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">9. Disclaimers</h2>
          <p>
            The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, Trailblaize excludes all representations, warranties, conditions and terms relating to our service and the use of our service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">10. Limitation of Liability</h2>
          <p>
            In no event shall Trailblaize, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">11. Governing Law</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of the State of Delaware, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">12. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">13. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us:</p>
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
