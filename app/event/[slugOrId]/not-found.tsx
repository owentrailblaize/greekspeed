import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-8 h-8 text-brand-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Event Not Found
        </h1>
        
        <p className="text-gray-600 mb-8">
          This event may have been removed, cancelled, or the link might be incorrect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
              Sign In
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-8">
          Looking for chapter events?{' '}
          <Link href="/login" className="text-brand-primary hover:underline">
            Sign in to view your chapter&apos;s events
          </Link>
        </p>
      </div>
    </div>
  );
}

