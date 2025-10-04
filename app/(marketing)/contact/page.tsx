'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/MarketingHeader';
import { Mail, Clock, CheckCircle, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

// Support feature cards data
const supportFeatures = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email with detailed responses to your questions"
  },
  {
    icon: Clock,
    title: "Quick Response",
    description: "We aim to respond to all inquiries within 24 hours"
  },
  {
    icon: CheckCircle,
    title: "Expert Support",
    description: "Our team understands Greek organizations and their unique needs"
  }
];

// FAQ data
const faqs = [
  {
    question: "How do I get started with Trailblaize?",
    answer: "Getting started is easy! Simply sign up for an account, complete your chapter profile, and our team will guide you through the setup process. We offer personalized onboarding to ensure your chapter gets the most out of our platform."
  },
  {
    question: "What types of support do you offer?",
    answer: "We provide comprehensive support through email, phone, and SMS. Our support team specializes in Greek organizations and can help with technical issues, feature questions, billing, and best practices for chapter management."
  },
  {
    question: "How secure is our chapter data?",
    answer: "Data security is our top priority. We use enterprise-grade encryption, secure servers, and comply with industry standards. Your chapter's information is protected with the same level of security used by major financial institutions."
  },
  {
    question: "Can I customize Trailblaize for our chapter's needs?",
    answer: "Absolutely! Trailblaize offers extensive customization options including custom fields, branding, workflow automation, and integration with your existing systems. Our team works with you to tailor the platform to your chapter's unique requirements."
  }
];

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Don't clear email immediately - let the user see the success message
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Use the shared header component */}
      <MarketingHeader />
      
      <div className="pt-16">
        {/* Hero Section - Apollo Style */}
        <section className="relative py-20 bg-gradient-to-br from-navy-50 via-white to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Promotional Text */}
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Ready to transform your chapter management?
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Trailblaize helps Greek organizations streamline operations, connect alumni, 
                  and manage finances better than any other platform on the market.
                </p>
              </div>

               {/* Right Side - Simple Contact Form */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in touch with Trailblaize</h2>
                <p className="text-gray-600 mb-6">
                  We'd love to show how Trailblaize can help your chapter thrive.
                </p>
                
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✓ Thanks! We've sent a confirmation email to {email}. Our support team will reach out within 24 hours.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">
                      ✗ Something went wrong. Please try again or email us directly at support@trailblaize.net
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Organization email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-base disabled:bg-gray-100"
                      placeholder="your-chapter@university.edu"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-navy-600 hover:bg-navy-700 text-white py-3 text-lg font-medium rounded-lg disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Get In Touch'}
                  </Button>
                </form>
                
                <p className="text-xs text-gray-500 mt-4">
                  By submitting this form, you will receive information, tips, and promotions from Trailblaize. 
                  To learn more, see our{' '}
                  <a href="/privacy" className="text-navy-600 hover:underline">
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Features Section - Horizontal Row Layout */}
        <section className="py-8 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Horizontal Row Layout for Support Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {supportFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300 border-gray-100">
                    <CardContent className="p-0">
                      <div className="flex flex-col items-center">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-navy-100 rounded-lg flex items-center justify-center mb-4">
                          <IconComponent className="h-6 w-6 text-navy-600" />
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bottom testimonial text */}
            <div className="text-center mt-12">
              <p className="text-gray-500 text-sm">
                Thousands of chapters at universities nationwide trust Trailblaize for their management needs.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section - Apollo Style */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left Side - FAQ Title */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              {/* Right Side - FAQ List */}
              <div className="space-y-0">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full text-left py-6 flex items-center justify-between hover:text-navy-600 transition-colors"
                    >
                      <span className="text-lg font-medium text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <div className="flex-shrink-0">
                        {openFAQ === index ? (
                          <Minus className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Plus className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </button>
                    
                    {openFAQ === index && (
                      <div className="pb-6">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
