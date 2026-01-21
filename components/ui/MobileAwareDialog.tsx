'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMobileModal } from '@/lib/hooks/useMobileModal';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface MobileAwareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  mobileClassName?: string;
  desktopClassName?: string;
  lockBody?: boolean;
  onPointerDownOutside?: (e: Event) => void;
  onInteractOutside?: (e: Event) => void;
}

export function MobileAwareDialog({
  isOpen,
  onClose,
  children,
  mobileClassName,
  desktopClassName,
  lockBody = true,
  onPointerDownOutside,
  onInteractOutside,
}: MobileAwareDialogProps) {
  const isMobile = useIsMobile();
  const { viewport } = useMobileModal({ isOpen, lockBody });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          isMobile
            ? mobileClassName || "fixed left-0 right-0 bottom-0 top-auto z-50 w-full rounded-t-2xl rounded-b-none flex flex-col overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] p-0 translate-x-0 translate-y-0"
            : desktopClassName || "sm:max-w-[720px] max-w-[95vw] h-[85vh] flex flex-col overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0 fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
          "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        )}
        style={isMobile ? {
          height: 'var(--vvh, 85dvh)',
          maxHeight: 'var(--vvh, 85dvh)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))',
        } : undefined}
        onPointerDownOutside={onPointerDownOutside}
        onInteractOutside={onInteractOutside}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

