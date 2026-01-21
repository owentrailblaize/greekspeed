import { useEffect, useState } from 'react';
import { useViewport } from '@/lib/contexts/ViewportContext';
import { lockBodyScroll } from '@/lib/utils/scrollLock';

interface UseMobileModalOptions {
  isOpen: boolean;
  lockBody?: boolean;
  autoFocus?: boolean;
  focusElement?: HTMLElement | null;
}

export function useMobileModal({
  isOpen,
  lockBody = true,
  autoFocus = false,
  focusElement,
}: UseMobileModalOptions) {
  const { viewport, lockScroll } = useViewport();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen || !lockBody) return;

    if (viewport.isMobile) {
      lockBodyScroll(true);
    }

    return () => {
      if (viewport.isMobile) {
        lockBodyScroll(false);
      }
    };
  }, [isOpen, lockBody, viewport.isMobile]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && autoFocus && focusElement) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        focusElement.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoFocus, focusElement]);

  return {
    isMounted,
    viewport,
    keyboardHeight: viewport.keyboardHeight,
    isKeyboardVisible: viewport.isKeyboardVisible,
  };
}

