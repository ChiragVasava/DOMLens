/**
 * Qursor++ - Theme & Design Token Manager (100% Synchronized Theme Engine)
 * 
 * Centralized Theme Manager handling Dark, Light, and System themes using CSS Custom Properties.
 * Persists theme preference in chrome.storage.sync and syncs in real-time across Popup and Floating Inspector Panel.
 */

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
};

export const THEME_STORAGE_KEY = 'qursor_theme_preference';

/**
 * Theme Design Tokens Definitions
 */
export const DESIGN_TOKENS = `
  :host, [data-theme="light"] {
    --q-bg-primary: #f5f5f7;
    --q-bg-surface: #ffffff;
    --q-bg-surface-elevated: #e8e8ed;
    --q-bg-hover: rgba(0, 0, 0, 0.04);
    
    --q-border: #e5e5ea;
    --q-border-subtle: rgba(0, 0, 0, 0.06);
    --q-border-focus: #2563eb;
    
    --q-text-primary: #1d1d1f;
    --q-text-secondary: #424245;
    --q-text-muted: #86868b;
    --q-text-accent: #2563eb;
    
    --q-accent: #2563eb;
    --q-accent-bg: rgba(37, 99, 235, 0.08);
    --q-accent-hover: #1d4ed8;
    
    --q-success: #34c759;
    --q-success-bg: rgba(52, 199, 89, 0.12);
    --q-warning: #ff9500;
    --q-warning-bg: rgba(255, 149, 0, 0.12);
    --q-error: #ff3b30;
    --q-error-bg: rgba(255, 59, 48, 0.12);
    
    --q-overlay-hover-border: 2px solid #2563eb;
    --q-overlay-hover-bg: rgba(37, 99, 235, 0.12);
    --q-overlay-hover-shadow: 0 0 12px rgba(37, 99, 235, 0.35);
    
    --q-overlay-select-border: 2px solid #2563eb;
    --q-overlay-select-bg: rgba(37, 99, 235, 0.12);
    --q-overlay-select-shadow: 0 0 14px rgba(37, 99, 235, 0.4);
    
    --q-code-bg: #f8fafc;
    --q-code-text: #1d1d1f;
    --q-code-keyword: #d946ef;
    --q-code-string: #059669;
    --q-code-attr: #2563eb;

    --q-shadow-panel: 0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  [data-theme="dark"] {
    --q-bg-primary: #161618;
    --q-bg-surface: #242426;
    --q-bg-surface-elevated: #2c2c2e;
    --q-bg-hover: rgba(255, 255, 255, 0.06);
    
    --q-border: #3a3a3c;
    --q-border-subtle: rgba(255, 255, 255, 0.08);
    --q-border-focus: #3b82f6;
    
    --q-text-primary: #f5f5f7;
    --q-text-secondary: #d1d1d6;
    --q-text-muted: #8e8e93;
    --q-text-accent: #3b82f6;
    
    --q-accent: #3b82f6;
    --q-accent-bg: rgba(59, 130, 246, 0.15);
    --q-accent-hover: #2563eb;
    
    --q-success: #30d158;
    --q-success-bg: rgba(48, 209, 88, 0.15);
    --q-warning: #ff9f0a;
    --q-warning-bg: rgba(255, 159, 10, 0.15);
    --q-error: #ff453a;
    --q-error-bg: rgba(255, 69, 58, 0.15);
    
    --q-overlay-hover-border: 2px solid #3b82f6;
    --q-overlay-hover-bg: rgba(59, 130, 246, 0.15);
    --q-overlay-hover-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
    
    --q-overlay-select-border: 2px solid #3b82f6;
    --q-overlay-select-bg: rgba(59, 130, 246, 0.15);
    --q-overlay-select-shadow: 0 0 14px rgba(59, 130, 246, 0.5);
    
    --q-code-bg: #1c1c1e;
    --q-code-text: #f5f5f7;
    --q-code-keyword: #f472b6;
    --q-code-string: #a7f3d0;
    --q-code-attr: #38bdf8;

    --q-shadow-panel: 0 20px 48px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
`;

export class ThemeManager {
  constructor(targetElement = null) {
    this.targetElement = targetElement;
    this.currentTheme = THEMES.LIGHT;
    this.listeners = [];
  }

  /**
   * Initializes theme from chrome.storage.sync
   */
  async init() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([THEME_STORAGE_KEY], (res) => {
        const storedTheme = res[THEME_STORAGE_KEY] || THEMES.LIGHT;
        this.setTheme(storedTheme, false);
        resolve(this.currentTheme);
      });
    });
  }

  /**
   * Sets current theme mode across target container, host element, and chrome storage
   * @param {string} theme 'dark' | 'light' | 'system'
   * @param {boolean} persist 
   */
  setTheme(theme, persist = true) {
    this.currentTheme = theme;
    const effectiveTheme = this.getEffectiveTheme(theme);

    if (this.targetElement) {
      if (this.targetElement.host) {
        this.targetElement.host.setAttribute('data-theme', effectiveTheme);
      }
      if (this.targetElement.querySelector) {
        const panel = this.targetElement.querySelector('.qursor-floating-panel');
        if (panel) panel.setAttribute('data-theme', effectiveTheme);
      }
      if (this.targetElement.setAttribute) {
        this.targetElement.setAttribute('data-theme', effectiveTheme);
      }
    }

    if (persist) {
      chrome.storage.sync.set({ [THEME_STORAGE_KEY]: theme });
    }

    this.notifyListeners(effectiveTheme);
  }

  getEffectiveTheme(theme) {
    if (theme === THEMES.SYSTEM) {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT;
    }
    return theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  }

  toggleTheme() {
    const nextTheme = this.getEffectiveTheme(this.currentTheme) === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    this.setTheme(nextTheme, true);
    return nextTheme;
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(theme) {
    this.listeners.forEach(cb => cb(theme));
  }
}
