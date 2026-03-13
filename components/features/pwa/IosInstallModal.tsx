'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Plus, Smartphone } from 'lucide-react';

interface IosInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

/**
 * Instructional modal for iOS: "Tap Share -> Add to Home Screen".
 * Only shown when not installed; dismissible and non-blocking.
 */
export function IosInstallModal({
  open,
  onOpenChange,
  onDismiss,
}: IosInstallModalProps) {
  const handleDismiss = () => {
    onOpenChange(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-brand-primary" aria-hidden />
            Install Trailblaize
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>To add this app to your home screen:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Share2 className="h-4 w-4 text-gray-600" aria-hidden />
                  </span>
                  Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Plus className="h-4 w-4 text-gray-600" aria-hidden />
                  </span>
                  Scroll and tap <strong>Add to Home Screen</strong>
                </li>
                <li>Tap <strong>Add</strong> in the top-right to confirm</li>
              </ol>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleDismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
