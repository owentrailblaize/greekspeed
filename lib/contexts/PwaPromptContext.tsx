'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { usePwaInstallState } from '@/lib/hooks/usePwaInstallState';
import { useOneSignalPush } from '@/lib/hooks/useOneSignalPush';
import { markInstallPromptDismissed } from '@/lib/utils/pwaPromptStorage';
import { markPushPromptDismissed } from '@/lib/utils/pushPromptStorage';
import { InstallPromptModal } from '@/components/features/pwa/InstallPromptModal';
import { IosInstallModal } from '@/components/features/pwa/IosInstallModal';
import { PushExplainerModal } from '@/components/features/pwa/PushExplainerModal';

interface PwaPromptContextValue {
  /** Open the Install app / Add to Home Screen modal. */
  showInstallPrompt: () => void;
  /** Open the Enable notifications modal. */
  showPushExplainer: () => void;
  /** True when install prompt can be shown (not installed, browser supports it). */
  canShowInstallPrompt: boolean;
  /** True when push explainer can be shown (push supported, permission default). */
  canShowPushExplainer: boolean;
  /** True when PWA is already installed. */
  isInstalled: boolean;
}

const PwaPromptContext = createContext<PwaPromptContextValue | null>(null);

export function usePwaPrompt(): PwaPromptContextValue | null {
  return useContext(PwaPromptContext);
}

interface PwaPromptProviderProps {
  userId: string | undefined;
  children: ReactNode;
}

/**
 * Provides manual-trigger access to A2HS and push notification prompts.
 * No automatic popups; users open these from the header dropdown.
 */
export function PwaPromptProvider({ userId, children }: PwaPromptProviderProps) {
  const { isInstalled, platform, canPromptInstall, deferredPrompt } = usePwaInstallState();
  const { permission, isPushSupported, isLoading: pushLoading, requestPermission } =
    useOneSignalPush(userId);

  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [showPushExplainer, setShowPushExplainer] = useState(false);
  const [pushRequesting, setPushRequesting] = useState(false);

  const showInstallPrompt = useCallback(() => {
    if (platform === 'ios') {
      setShowIosInstallModal(true);
    } else if (deferredPrompt && (platform === 'android' || platform === 'desktop')) {
      setShowInstallModal(true);
    }
  }, [platform, deferredPrompt]);

  const showPushExplainerAction = useCallback(() => {
    setShowPushExplainer(true);
  }, []);

  const handleInstallDismiss = useCallback(() => {
    if (userId) markInstallPromptDismissed(userId);
    setShowInstallModal(false);
    setShowIosInstallModal(false);
  }, [userId]);

  const handlePushEnable = useCallback(async () => {
    setPushRequesting(true);
    try {
      await requestPermission();
    } finally {
      setPushRequesting(false);
    }
  }, [requestPermission]);

  const handlePushDismiss = useCallback(() => {
    if (userId) markPushPromptDismissed(userId);
    setShowPushExplainer(false);
  }, [userId]);

  const canShowInstallPromptValue =
    !isInstalled && canPromptInstall;
  const canShowPushExplainerValue =
    !pushLoading && isPushSupported && permission === 'default';

  const value: PwaPromptContextValue = {
    showInstallPrompt,
    showPushExplainer: showPushExplainerAction,
    canShowInstallPrompt: canShowInstallPromptValue,
    canShowPushExplainer: canShowPushExplainerValue,
    isInstalled,
  };

  return (
    <PwaPromptContext.Provider value={value}>
      {children}
      <InstallPromptModal
        open={showInstallModal}
        onOpenChange={(open) => {
          setShowInstallModal(open);
          if (!open) handleInstallDismiss();
        }}
        deferredPrompt={deferredPrompt}
        onDismiss={handleInstallDismiss}
      />
      <IosInstallModal
        open={showIosInstallModal}
        onOpenChange={(open) => {
          setShowIosInstallModal(open);
          if (!open) handleInstallDismiss();
        }}
        onDismiss={handleInstallDismiss}
      />
      <PushExplainerModal
        open={showPushExplainer}
        onOpenChange={(open) => {
          setShowPushExplainer(open);
          if (!open) handlePushDismiss();
        }}
        onEnable={handlePushEnable}
        onDismiss={handlePushDismiss}
        isLoading={pushRequesting}
      />
    </PwaPromptContext.Provider>
  );
}
