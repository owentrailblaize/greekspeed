/**
 * Helpers for push subscription device/platform detection.
 * Used when persisting OneSignal subscription to backend.
 */

export function getDeviceType(): 'desktop' | 'mobile' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini/i.test(ua)
    ? 'mobile'
    : 'desktop';
}

export function getPlatform(): 'desktop' | 'ios_pwa' | 'android' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod|mac/.test(ua)) return 'ios_pwa';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}
