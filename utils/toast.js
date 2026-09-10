/**
 * Qursor++ - Toast Notification Manager
 * 
 * Lightweight notification manager providing smooth developer-grade action toasts.
 */

export class ToastManager {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.container = null;
    this.init();
  }

  init() {
    if (!this.shadowRoot) return;

    // Create toast container if not present
    let container = this.shadowRoot.querySelector('.q-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'q-toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 2147483647;
        pointer-events: none;
      `;
      this.shadowRoot.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Displays a toast notification
   * @param {string} message 
   * @param {'success' | 'info' | 'warning' | 'error'} type 
   * @param {number} duration 
   */
  show(message, type = 'success', duration = 2400) {
    if (!this.container) this.init();
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `q-toast q-toast-${type}`;

    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠️',
      error: '✕'
    };

    const colors = {
      success: 'var(--q-success, #10b981)',
      info: 'var(--q-accent, #38bdf8)',
      warning: 'var(--q-warning, #f59e0b)',
      error: 'var(--q-error, #ef4444)'
    };

    toast.style.cssText = `
      background: var(--q-bg-surface, #1e293b);
      color: var(--q-text-primary, #f8fafc);
      border: 1px solid var(--q-border, #334155);
      border-left: 3px solid ${colors[type]};
      border-radius: 8px;
      padding: 8px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(12px) scale(0.95);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      white-space: nowrap;
    `;

    toast.innerHTML = `
      <span style="color:${colors[type]}; font-weight:bold;">${icons[type]}</span>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';
    });

    // Auto dismiss
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px) scale(0.95)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, duration);
  }
}
