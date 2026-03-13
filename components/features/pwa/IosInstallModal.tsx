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
import { Share2, Plus, Smartphone, ImageIcon, Share } from 'lucide-react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface IosInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

/** Placeholder for future "how to add to home screen" image (e.g. screenshot or illustration). */
const INSTALL_GUIDE_IMAGE_PLACEHOLDER = '/A2HS-Flow.jpeg';

const InstallStepsContent = () => (
  <>
    <p className="text-sm text-muted-foreground mb-3">
      To add this app to your home screen:
    </p>
    <ol className="list-decimal list-inside space-y-2 text-sm text-left">
      <li>
        Tap the{" "}
        <span className="inline-flex h-4 w-4 items-center justify-center align-middle">
          <Share className="h-4 w-4 text-gray-600" aria-hidden />
        </span>{" "}
        button in the bottom bar
      </li>
      <li>
        Scroll and tap <strong>Add to Home Screen</strong>
      </li>
      <li>
        Tap <strong>Add</strong> in the top-right to confirm
      </li>
    </ol>
  </>
);

/**
 * Instructional modal/drawer for iOS: "Tap Share -> Add to Home Screen".
 * On mobile: vaul bottom drawer. On desktop: centered dialog (fallback).
 * Only shown when not installed; dismissible and non-blocking.
 */
export function IosInstallModal({
  open,
  onOpenChange,
  onDismiss,
}: IosInstallModalProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDismiss = () => {
    onOpenChange(false);
    onDismiss();
  };

  const titleContent = (
    <span className="flex items-center gap-2">
      <Smartphone className="h-5 w-5 text-brand-primary" aria-hidden />
      Install Trailblaize
    </span>
  );

  const imageSection = (
    <div className="my-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center min-h-[140px] p-4">
      {INSTALL_GUIDE_IMAGE_PLACEHOLDER ? (
        <img
          src={INSTALL_GUIDE_IMAGE_PLACEHOLDER}
          alt="How to add Trailblaize to your home screen"
          className="max-w-full h-auto rounded-lg object-contain max-h-[200px]"
        />
      ) : (
        <>
          <ImageIcon className="h-10 w-10 text-gray-400 mb-2" aria-hidden />
          <p className="text-sm text-gray-500 text-center">
            Visual guide image (placeholder)
          </p>
          <p className="text-xs text-gray-400 mt-1">Replace with screenshot or illustration</p>
        </>
      )}
    </div>
  );

  if (mounted && isMobile) {
    return (
      <Drawer.Root
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleDismiss();
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
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <InstallStepsContent />
              {imageSection}
            </div>
            <div className="flex-shrink-0 p-4 pt-0 border-t border-gray-100">
              <Button type="button" variant="outline" className="w-full rounded-full" onClick={handleDismiss}>
                Got it
              </Button>
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
            <div className="space-y-3 text-left">
              <InstallStepsContent />
              {imageSection}
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
