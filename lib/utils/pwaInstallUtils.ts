/**
 * PWA install state detection for A2HS flow.
 * Single source of truth for platform and standalone detection.
 */

import type { PwaPlatform } from '@/types/pwa';

function getNavigator(): Navigator | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator;
}

/**
 * Detects device class: iOS (Safari), Android, or Desktop.
 * Does not treat macOS as iOS (unlike legacy getPlatform in pushUtils).
 */
export function getPwaPlatform(): PwaPlatform {
  const nav = getNavigator();
  if (!nav) return 'desktop';
  const ua = nav.userAgent.toLowerCase();
  // iOS: iPhone, iPad, iPod only (exclude Mac)
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

/**
 * True when the app is running as an installed PWA (standalone display mode).
 * Uses display-mode media query and iOS standalone flag.
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = getNavigator();
  // Standard PWA display mode (Android, Desktop, and some iOS)
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari standalone (Add to Home Screen)
  const navWithStandalone = nav as Navigator & { standalone?: boolean };
  if (navWithStandalone.standalone === true) return true;
  return false;
}