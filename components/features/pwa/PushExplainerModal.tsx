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
import { Bell } from 'lucide-react';

interface PushExplainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

/**
 * Explainer shown before requesting push permission: what notifications are for,
 * how often they occur. Only show after install (iOS) or engagement (others).
 * "Enable" triggers OneSignal permission request.
 */
export function PushExplainerModal({
  open,
  onOpenChange,
  onEnable,
  onDismiss,
  isLoading = false,
}: PushExplainerModalProps) {
  const handleEnable = () => {
    onEnable();
    onOpenChange(false);
  };

  const handleLater = () => {
    onOpenChange(false);
    onDismiss();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-primary" aria-hidden />
            Stay in the loop
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-left text-sm">
              <p>
                Enable notifications to get timely updates from your chapter:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Chapter announcements and events</li>
                <li>Messages and connection requests</li>
                <li>Reminders for upcoming events</li>
              </ul>
              <p className="text-muted-foreground">
                We only send notifications when something needs your attention. You can turn them off anytime in Settings.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={handleLater}>
            Not now
          </Button>
          <Button type="button" onClick={handleEnable} disabled={isLoading}>
            {isLoading ? 'Enabling...' : 'Enable notifications'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
