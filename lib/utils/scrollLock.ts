/**
 * Utility functions for managing body scroll lock
 * Used by modals, sheets, and other overlays
 * 
 * Uses reference counting to handle nested modals correctly
 */

let scrollLockCount = 0;
let savedScrollY = 0;

export function lockBodyScroll(locked: boolean) {
  if (typeof window === 'undefined') return;

  const body = document.body;
  const html = document.documentElement;

  if (locked) {
    scrollLockCount++;
    if (scrollLockCount === 1) {
      // First lock - save scroll position
      savedScrollY = window.scrollY;
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      html.style.overflow = 'hidden';
    }
  } else {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      // Last unlock - restore scroll position
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      html.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
  }
}

export function resetScrollLock() {
  scrollLockCount = 0;
  savedScrollY = 0;
  if (typeof window !== 'undefined') {
    const body = document.body;
    const html = document.documentElement;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    html.style.overflow = '';
  }
}

