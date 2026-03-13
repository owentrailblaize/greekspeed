'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { BeforeInstallPromptEvent } from '@/types/pwa';
import { Download } from 'lucide-react';

interface InstallPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deferredPrompt: BeforeInstallPromptEvent | null;
  onDismiss: () => void;
}

/**
 * A2HS modal for Android/Desktop. Shows custom UI and calls prompt() only on user click.
 * Native install prompt appears when user taps Install.
 */
export function InstallPromptModal({
  open,
  onOpenChange,
  deferredPrompt,
  onDismiss,
}: InstallPromptModalProps) {
  const [isPrompting, setIsPrompting] = useState(false);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsPrompting(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted' || outcome === 'dismissed') {
        onOpenChange(false);
        onDismiss();
      }
    } catch {
      onOpenChange(false);
      onDismiss();
    } finally {
      setIsPrompting(false);
    }
  };

  const handleNotNow = () => {
    onOpenChange(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install Trailblaize</DialogTitle>
          <DialogDescription>
            Add the app to your home screen for quick access and a better experience. Works offline and feels like a native app.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={handleNotNow}>
            Not now
          </Button>
          <Button
            type="button"
            onClick={handleInstall}
            disabled={!deferredPrompt || isPrompting}
          >
            <Download className="h-4 w-4 mr-2" aria-hidden />
            {isPrompting ? 'Opening...' : 'Install'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
