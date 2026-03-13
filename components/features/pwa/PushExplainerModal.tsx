'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface PushExplainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

const ExplainerContent = () => (
  <div className="space-y-3 text-left text-sm">
    <p>
      Enable notifications to get timely updates from your chapter:
    </p>
    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
      <li>Chapter announcements and events</li>
      <li>Messages and connection requests</li>
      <li>Notifications directly from Trailblaize</li>
    </ul>
  </div>
);

const FooterButtons = ({
  onLater,
  onEnable,
  isLoading,
}: {
  onLater: () => void;
  onEnable: () => void;
  isLoading: boolean;
}) => (
  <div className="flex flex-row items-stretch gap-3 w-full">
    <Button
      type="button"
      variant="ghost"
      onClick={onLater}
      className="flex-1 rounded-full"
    >
      Not now
    </Button>
    <Button
      type="button"
      onClick={onEnable}
      disabled={isLoading}
      className="flex-1 rounded-full"
    >
      {isLoading ? 'Enabling...' : 'Enable notifications'}
    </Button>
  </div>
);

/**
 * Explainer shown before requesting push permission: what notifications are for,
 * how often they occur. On mobile: vaul bottom drawer. On desktop: centered dialog.
 * "Enable" triggers OneSignal permission request.
 */
export function PushExplainerModal({
  open,
  onOpenChange,
  onEnable,
  onDismiss,
  isLoading = false,
}: PushExplainerModalProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnable = () => {
    onEnable();
    onOpenChange(false);
  };

  const handleLater = () => {
    onOpenChange(false);
    onDismiss();
  };

  const titleContent = (
    <span className="flex items-center gap-2">
      <Bell className="h-5 w-5 text-brand-primary" aria-hidden />
      Stay in the loop
    </span>
  );

  if (mounted && isMobile) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleLater();
          else onOpenChange(isOpen);
        }}
        direction="bottom"
        modal
        dismissible
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[10002] bg-black/40 transition-opacity" />
          <Drawer.Content
            className="
              bg-white flex flex-col rounded-t-[20px] z-[10003]
              fixed bottom-0 left-0 right-0
              max-h-[85dvh] min-h-[40dvh]
              shadow-2xl border border-gray-200 border-b-0
              outline-none p-0
            "
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-2" aria-hidden />
            <div className="flex-shrink-0 px-4 pb-2">
              <Drawer.Title className="text-lg font-semibold text-gray-900">
                {titleContent}
              </Drawer.Title>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <ExplainerContent />
            </div>
            <div className="flex-shrink-0 px-4 pt-4 pb-6 border-t border-gray-100">
              <FooterButtons onLater={handleLater} onEnable={handleEnable} isLoading={isLoading} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {titleContent}
          </DialogTitle>
          <DialogDescription asChild>
            <ExplainerContent />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2">
          <FooterButtons onLater={handleLater} onEnable={handleEnable} isLoading={isLoading} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
