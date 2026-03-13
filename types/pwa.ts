/**
 * PWA install state and platform types for A2HS and push opt-in flow.
 * Used by usePwaInstallState and A2HS/push UI (e.g. header dropdown).
 */

export type PwaPlatform = 'ios' | 'android' | 'desktop';

export interface PwaInstallState {
  /** True when app is running in standalone/installed mode. */
  isInstalled: boolean;
  /** Detected device class: iOS Safari, Android Chrome, or Desktop. */
  platform: PwaPlatform;
  /** True when we can show an install prompt (iOS: manual instructions; Android/Desktop: beforeinstallprompt). */
  canPromptInstall: boolean;
}

/**
 * beforeinstallprompt event payload (Chrome/Edge on Android/Desktop).
 * Stored by usePwaInstallState for use by A2HS prompt components.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}