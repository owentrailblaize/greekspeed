'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  MousePointerClick,
  FileDown,
  Upload,
  ExternalLink,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';

interface LinkedInPdfHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Open LinkedIn on Desktop',
    description: 'Go to linkedin.com using a desktop browser (Chrome, Firefox, Safari, or Edge)',
    icon: <Monitor className="h-5 w-5" />,
  },
  {
    number: 2,
    title: 'Navigate to Your Profile',
    description: 'Click on your profile picture or "View Profile" to open your profile page',
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    number: 3,
    title: 'Click "More" Button',
    description: 'Look for the "More" button below your profile header, next to "Open to" and "Add profile section"',
    icon: <MousePointerClick className="h-5 w-5" />,
  },
  {
    number: 4,
    title: 'Select "Save to PDF"',
    description: 'In the dropdown menu, click "Save to PDF" — LinkedIn will generate and download your profile',
    icon: <FileDown className="h-5 w-5" />,
  },
  {
    number: 5,
    title: 'Upload Here',
    description: 'Once downloaded, upload the PDF file using the option on the previous screen',
    icon: <Upload className="h-5 w-5" />,
  },
];

export function LinkedInPdfHelpModal({ isOpen, onClose }: LinkedInPdfHelpModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is on mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenLinkedIn = () => {
    window.open('https://www.linkedin.com/in/', '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            How to Download Your LinkedIn PDF
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Follow these steps to export your LinkedIn profile as a PDF file.
          </DialogDescription>
        </DialogHeader>

        {/* Mobile Warning */}
        {isMobile && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex-shrink-0 p-1.5 bg-amber-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">
                Desktop Required
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                LinkedIn's "Save to PDF" feature is only available on desktop browsers.
                Please open LinkedIn on a computer to download your profile PDF.
              </p>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4 mt-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Step Number Badge */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">
                  {step.number}
                </div>
                {step.number < steps.length && (
                  <div className="w-0.5 h-4 bg-gray-200 mt-1" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-grow min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{step.icon}</span>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {step.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Note:</strong> The PDF export feature requires LinkedIn to be in English.
                If your LinkedIn is in another language, temporarily switch to English in
                Settings → Account Preferences → Language.
              </p>
              <p>
                The downloaded file will be named something like{' '}
                <code className="px-1 py-0.5 bg-gray-200 rounded text-gray-700">
                  Profile.pdf
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleOpenLinkedIn}
            className="flex-1 gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open LinkedIn
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-brand-primary hover:bg-brand-primary-hover"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}