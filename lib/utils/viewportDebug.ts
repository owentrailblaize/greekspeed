/**
 * Debug utility for viewport and keyboard tracking
 * Only enabled in development mode
 */

export function enableViewportDebug() {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;

  // Check if debug element already exists
  if (document.getElementById('viewport-debug')) return;

  const debugEl = document.createElement('div');
  debugEl.id = 'viewport-debug';
  debugEl.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.85);
    color: white;
    padding: 12px;
    font-size: 11px;
    z-index: 99999;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    border-radius: 6px;
    line-height: 1.6;
    max-width: 250px;
    pointer-events: none;
  `;
  document.body.appendChild(debugEl);

  const update = () => {
    const vv = window.visualViewport;
    const kb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--kb')) || 0;
    const vvh = getComputedStyle(document.documentElement).getPropertyValue('--vvh');
    const layoutHeight = window.innerHeight;
    const visualHeight = vv?.height || layoutHeight;
    
    debugEl.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px;">
        Viewport Debug
      </div>
      <div>Layout Height: ${layoutHeight}px</div>
      <div>Visual Height: ${visualHeight}px</div>
      <div>Keyboard: ${kb}px</div>
      <div>--vvh: ${vvh}</div>
      <div>--kb: ${getComputedStyle(document.documentElement).getPropertyValue('--kb')}</div>
      <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 10px; opacity: 0.8;">
        ${vv ? 'Visual Viewport API: ✓' : 'Visual Viewport API: ✗'}
      </div>
    `;
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
  }
  window.addEventListener('resize', update);
  update();

  // Return cleanup function
  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    }
    window.removeEventListener('resize', update);
    debugEl.remove();
  };
}

