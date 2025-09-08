'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName?: string;
  chapterName?: string;
}

export function WelcomeModal({ isOpen, onClose, memberName, chapterName }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Clean up the member name for display
  const displayName = memberName && memberName.trim() !== '' ? memberName : 'Member';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
            Welcome to {chapterName || 'Your Chapter'}!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Membership Approved</span>
          </div>
          
          <p className="text-gray-600 text-center">
            Congratulations, {displayName}! Your membership has been approved and you now have full access to the chapter platform.
          </p>
          
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Users className="h-5 w-5" />
              <span className="font-medium">What's Next?</span>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-blue-700 text-center">
              <li>• Connect with fellow members</li>
              <li>• Join upcoming events</li>
              <li>• Access chapter resources</li>
              <li>• Stay updated with announcements</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleClose}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            Get Started
        </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
