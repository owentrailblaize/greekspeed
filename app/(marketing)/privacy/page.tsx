'use client';
import { MarketingHeader } from '@/components/MarketingHeader';

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
          Last Updated: January 1, 2025
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
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            Trailblaize, Inc. ("Trailblaize", "we" or "us") offers a comprehensive platform through which Greek organizations and their members ("Customers", "Users" or "you") can manage chapter operations, connect with alumni, process dues, and coordinate events (collectively, the "Services").
          </p>

          <p>
            This Privacy Policy explains how we process personal information, including member contact information and other types of personal information that are submitted to us through our Services or otherwise collected, stored, used, disclosed, inferred, acquired or processed by us in connection with developing, improving or providing our Services.
          </p>

          <p>
            This Privacy Policy also describes Trailblaize's practices for collecting, storing, using, disclosing, and otherwise processing personal information in relation to visitors to our website ("Website"), Trailblaize's marketing activities, and Customers' use and access of our Services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">1. Information we use to provide the service</h2>
          <p>
            We use a variety of information that we obtain from various sources, including our Customers and their users, and we may also generate new information about you (derived personal information) by analyzing or combining other data we collect, in order to provide the Service.
          </p>

          <h3 className="text-xl font-bold text-gray-800 pt-2 pb-2">Information we collect from third party sources</h3>
          <p>
            We may obtain information from third party sources, such as data providers and integration parties, or from public sources and methods, such as information available on public APIs and the internet. Trailblaize is committed to lawful data collection and requires our data providers to certify lawful collection and consent.
          </p>

          <h3 className="text-xl font-bold text-gray-800 pt-2 pb-2">Information Customers and Users submit to us</h3>
          <p>
            Customers and their Users may provide a variety of information to us through the Service.
          </p>
          <p className="font-bold">This includes:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Users' own contact and other personal information, such as name, email address, telephone number, job title, employer and location.</li>
            <li>Information about our Customers' chapter members and alumni, such as their contacts list or member directory; including for instance, name, email address, telephone number, graduation year, chapter affiliation and location.</li>
            <li>Other personal information, such as website visitor IP addresses, that our Customers submit to us through their use of our Service.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">2. SMS/Messaging Communications</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-bold text-yellow-800 mb-2">Important: SMS Consent and Usage</p>
            <p className="text-yellow-800 mb-3">
              By providing your phone number, you consent to receive SMS messages from Trailblaize, Inc. regarding your chapter membership and our services.
            </p>
            <ul className="list-disc list-inside ml-4 text-yellow-800 space-y-1">
              <li><strong>Message Types:</strong> Chapter announcements, event reminders, dues notifications, and service updates</li>
              <li><strong>Frequency:</strong> Varies by chapter activity and your preferences (typically 2-4 messages per month)</li>
              <li><strong>Costs:</strong> Standard message and data rates may apply according to your mobile carrier plan</li>
              <li><strong>Opt-out:</strong> Reply "STOP" to any message to unsubscribe from SMS communications</li>
              <li><strong>Help:</strong> Reply "HELP" to any message for assistance or contact support@trailblaize.net</li>
            </ul>
            <p className="text-yellow-800 text-sm mt-3">
              We may share your phone number with our SMS service provider (Twilio) solely for the purpose of delivering messages as described above.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">3. How we use your information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Provide and maintain our Services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send you important updates and communications</li>
            <li>Enable alumni networking and connections</li>
            <li>Improve our Services and develop new features</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">4. Information sharing and disclosure</h2>
          <p>
            We may share your information in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating our services (e.g., Twilio for SMS, Stripe for payments, Supabase for data storage)</li>
            <li><strong>Chapter Members:</strong> Basic profile information with other members of your chapter for networking purposes</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">5. Data security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments and updates, access controls and authentication measures, and secure payment processing through PCI-compliant providers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">6. Your rights and choices</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Access and update your personal information</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent for SMS messaging (reply "STOP")</li>
            <li>Request a copy of your data</li>
          </ul>
          <p>
            To exercise these rights, please contact us at <a href="mailto:privacy@trailblaize.net" className="text-blue-600 hover:underline">privacy@trailblaize.net</a>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">7. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">8. Contact us</h2>
          <p>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <p>
            <strong>Trailblaize, Inc.</strong><br />
            Email: <a href="mailto:privacy@trailblaize.net" className="text-blue-600 hover:underline">privacy@trailblaize.net</a><br />
            Support: <a href="mailto:support@trailblaize.net" className="text-blue-600 hover:underline">support@trailblaize.net</a>
          </p>
        </div>
      </div>
    </div>
  );
}
