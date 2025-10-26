'use client';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';

export default function SMSTermsPage() {
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

        {/* SMS Terms Content - Plain Text */}
        <div className="space-y-2 text-gray-700 leading-relaxed">
          <p>
            These SMS Terms and Conditions ("SMS Terms") govern your participation in our optional SMS messaging program. 
            <strong>SMS messaging is completely optional</strong> and separate from your account creation. 
            You can use Trailblaize services without opting in to SMS communications.
          </p>
          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">1. Message Program Description</h2>
          <p>
            Trailblaize sends SMS messages to help Greek organizations manage chapter operations, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Chapter announcements and updates</li>
            <li>Event reminders and notifications</li>
            <li>Dues payment reminders</li>
            <li>Important chapter communications</li>
            <li>Service updates and alerts</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">2. Message Frequency</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="font-bold text-yellow-800 mb-2">Important: Message Frequency Information</p>
            <p className="text-yellow-800">
              Message frequency varies by chapter activity and your preferences. You can expect to receive approximately 2-4 messages per month, though this may increase during active periods such as recruitment, events, or dues collection periods.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">3. Message and Data Rates</h2>
          <p>
            Standard message and data rates may apply according to your mobile carrier plan. Trailblaize does not charge for sending SMS messages, but your carrier may charge you for receiving them. Please check with your mobile carrier for details about your messaging plan.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">4. How to Opt-In</h2>
          <p>
            You opt-in to receive SMS messages by:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Providing your phone number during account creation or profile setup</li>
            <li>Checking the SMS consent box when prompted</li>
            <li>Responding "YES" to an opt-in message if applicable</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">5. How to Opt-Out</h2>
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="font-bold text-red-800 mb-2">Opt-Out Instructions</p>
            <ul className="list-disc list-inside ml-4 text-red-800 space-y-1">
              <li><strong>Reply "STOP"</strong> to any message to unsubscribe from SMS communications</li>
              <li>You will receive a confirmation message confirming your opt-out</li>
              <li>You can also opt-out by contacting support@trailblaize.net</li>
              <li>Opting out will stop all SMS messages from Trailblaize</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">6. How to Get Help</h2>
          <p>
            For assistance with our SMS messaging program:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>Reply "HELP"</strong> to any message for immediate assistance</li>
            <li>Email us at support@trailblaize.net</li>
            <li>Visit our contact page at trailblaize.net/contact</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">7. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Our collection and use of your phone number and message data is governed by our Privacy Policy, which you can view at <a href="/privacy" className="text-blue-600 hover:underline">trailblaize.net/privacy</a>. By participating in our SMS program, you agree to the terms of our Privacy Policy.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">8. Message Delivery</h2>
          <p>
            While we strive to deliver all messages promptly, we cannot guarantee delivery of SMS messages. Factors such as carrier issues, phone number changes, or technical problems may prevent message delivery. We are not liable for any messages that are not received.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">9. Changes to These Terms</h2>
          <p>
            We may update these SMS Terms from time to time. We will notify you of any material changes by sending you a message or posting the updated terms on our website. Your continued participation in our SMS program after changes are made constitutes acceptance of the new terms.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4 pb-2">10. Contact Information</h2>
          <p>If you have any questions about these SMS Terms, please contact us:</p>
          <p>
            <strong>Trailblaize, Inc.</strong><br />
            1111B South Governors Avenue<br />
            Dover, DE 19904<br />
            Email: <a href="mailto:support@trailblaize.net" className="text-blue-600 hover:underline">support@trailblaize.net</a><br />
            SMS Support: Reply "HELP" to any message
          </p>
        </div>
      </div>
    </div>
  );
}
