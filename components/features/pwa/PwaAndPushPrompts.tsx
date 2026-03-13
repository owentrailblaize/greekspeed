'use client';

import { useEffect, useState, useRef } from 'react';
import { usePwaInstallState } from '@/lib/hooks/usePwaInstallState';
import { useOneSignalPush } from '@/lib/hooks/useOneSignalPush';
import {
  markFirstVisit,
  incrementSessionCount,
  consumeFromOnboarding,
  shouldShowInstallPrompt,
  markInstallPromptDismissed,
  setShownAfterOnboarding,
} from '@/lib/utils/pwaPromptStorage';
import { canShowPushExplainer, markPushPromptDismissed } from '@/lib/utils/pushPromptStorage';
import { InstallPromptModal } from './InstallPromptModal';
import { IosInstallModal } from './IosInstallModal';
import { PushExplainerModal } from './PushExplainerModal';

const PUSH_EXPLAINER_DELAY_MS = 800;

interface PwaAndPushPromptsProps {
  userId: string | undefined;
}

/**
 * Orchestrates A2HS and push prompts: timing (after onboarding or X sessions, not first visit),
 * install modal (Android/Desktop native prompt, iOS instructions), push explainer then OneSignal.
 */
export function PwaAndPushPrompts({ userId }: PwaAndPushPromptsProps) {
  const { isInstalled, platform, canPromptInstall, deferredPrompt } = usePwaInstallState();
  const { permission, isPushSupported, isLoading: pushLoading, requestPermission } = useOneSignalPush(userId);

  const [sessionCount, setSessionCount] = useState(0);
  const [fromOnboarding, setFromOnboardingState] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showIosInstallModal, setShowIosInstallModal] = useState(false);
  const [showPushExplainer, setShowPushExplainer] = useState(false);
  const [pushRequesting, setPushRequesting] = useState(false);
  const pushExplainerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark first visit and increment session count on dashboard mount
  useEffect(() => {
    if (!userId) return;
    markFirstVisit(userId);
    const count = incrementSessionCount(userId);
    setSessionCount(count);
    setFromOnboardingState(consumeFromOnboarding());
  }, [userId]);

  // Decide whether to show install prompt (not first visit; after onboarding or X sessions; not in cooldown)
  useEffect(() => {
    if (!userId) return;
    const shouldShow = shouldShowInstallPrompt(userId, sessionCount, fromOnboarding, canPromptInstall);
    if (!shouldShow) return;

    if (platform === 'ios') {
      setShowIosInstallModal(true);
    } else if (deferredPrompt && (platform === 'android' || platform === 'desktop')) {
      setShowInstallModal(true);
    }
  }, [userId, sessionCount, fromOnboarding, canPromptInstall, platform, deferredPrompt]);

  // Show push explainer only when no install modal is open (after delay). iOS: only when installed.
  useEffect(() => {
    if (!userId || pushLoading) return;
    if (permission !== 'default' || !isPushSupported) return;
    if (!canShowPushExplainer(userId, permission)) return;

    const canShowPush = platform === 'ios' ? isInstalled : true;
    if (!canShowPush) return;

    const showingAnyInstallModal = showInstallModal || showIosInstallModal;
    if (showingAnyInstallModal) return;

    const maybeShowPush = () => {
      if (!canShowPushExplainer(userId, 'default')) return;
      setShowPushExplainer(true);
    };

    pushExplainerTimer.current = setTimeout(maybeShowPush, PUSH_EXPLAINER_DELAY_MS);

    return () => {
      if (pushExplainerTimer.current) {
        clearTimeout(pushExplainerTimer.current);
        pushExplainerTimer.current = null;
      }
    };
  }, [userId, platform, isInstalled, permission, isPushSupported, pushLoading, showInstallModal, showIosInstallModal]);

  const handleInstallDismiss = () => {
    if (userId) {
      markInstallPromptDismissed(userId);
      if (fromOnboarding) setShownAfterOnboarding(userId);
    }
    setShowInstallModal(false);
    setShowIosInstallModal(false);
  };

  const handlePushEnable = async () => {
    setPushRequesting(true);
    try {
      await requestPermission();
    } finally {
      setPushRequesting(false);
    }
  };

  const handlePushDismiss = () => {
    if (userId) markPushPromptDismissed(userId);
    setShowPushExplainer(false);
  };

  return (
    <>
      <InstallPromptModal
        open={showInstallModal}
        onOpenChange={setShowInstallModal}
        deferredPrompt={deferredPrompt}
        onDismiss={handleInstallDismiss}
      />
      <IosInstallModal
        open={showIosInstallModal}
        onOpenChange={setShowIosInstallModal}
        onDismiss={handleInstallDismiss}
      />
      <PushExplainerModal
        open={showPushExplainer}
        onOpenChange={setShowPushExplainer}
        onEnable={handlePushEnable}
        onDismiss={handlePushDismiss}
        isLoading={pushRequesting}
      />
    </>
  );
}
