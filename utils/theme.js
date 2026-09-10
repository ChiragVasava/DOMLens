/**
 * Qursor++ - Theme & Design Token Manager
 * 
 * Manages Dark, Light, and System themes using CSS Custom Properties (Design Tokens).
 * Persists user preference in chrome.storage.sync and syncs across popup and Shadow DOM.
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
  :host, [data-theme="dark"] {
    --q-bg-primary: #0f172a;
    --q-bg-surface: #1e293b;
    --q-bg-surface-elevated: #334155;
    --q-bg-hover: rgba(255, 255, 255, 0.05);
    
    --q-border: #334155;
    --q-border-subtle: rgba(255, 255, 255, 0.08);
    --q-border-focus: #38bdf8;
    
    --q-text-primary: #f8fafc;
    --q-text-secondary: #cbd5e1;
    --q-text-muted: #94a3b8;
    --q-text-accent: #38bdf8;
    
    --q-accent: #38bdf8;
    --q-accent-bg: rgba(56, 189, 248, 0.12);
    --q-accent-hover: #0284c7;
    
    --q-success: #10b981;
    --q-success-bg: rgba(16, 185, 129, 0.15);
    --q-warning: #f59e0b;
    --q-warning-bg: rgba(245, 158, 11, 0.15);
    --q-error: #ef4444;
    --q-error-bg: rgba(239, 68, 68, 0.15);
    
    --q-overlay-hover-border: 2px solid #38bdf8;
    --q-overlay-hover-bg: rgba(56, 189, 248, 0.15);
    --q-overlay-hover-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
    
    --q-overlay-select-border: 2px solid #10b981;
    --q-overlay-select-bg: rgba(16, 185, 129, 0.15);
    --q-overlay-select-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
    
    --q-code-bg: #090d16;
    --q-code-text: #e2e8f0;
    --q-code-keyword: #f472b6;
    --q-code-string: #a7f3d0;
    --q-code-attr: #38bdf8;

    --q-shadow-panel: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.25);
  }

  [data-theme="light"] {
    --q-bg-primary: #ffffff;
    --q-bg-surface: #f8fafc;
    --q-bg-surface-elevated: #f1f5f9;
    --q-bg-hover: rgba(0, 0, 0, 0.04);
    
    --q-border: #e2e8f0;
    --q-border-subtle: rgba(0, 0, 0, 0.06);
    --q-border-focus: #0284c7;
    
    --q-text-primary: #0f172a;
    --q-text-secondary: #334155;
    --q-text-muted: #64748b;
    --q-text-accent: #0284c7;
    
    --q-accent: #0284c7;
    --q-accent-bg: rgba(2, 132, 199, 0.1);
    --q-accent-hover: #0369a1;
    
    --q-success: #059669;
    --q-success-bg: rgba(5, 150, 105, 0.1);
    --q-warning: #d97706;
    --q-warning-bg: rgba(217, 119, 6, 0.1);
    --q-error: #dc2626;
    --q-error-bg: rgba(220, 38, 38, 0.1);
    
    --q-overlay-hover-border: 2px solid #0284c7;
    --q-overlay-hover-bg: rgba(2, 132, 199, 0.15);
    --q-overlay-hover-shadow: 0 0 10px rgba(2, 132, 199, 0.3);
    
    --q-overlay-select-border: 2px solid #059669;
    --q-overlay-select-bg: rgba(5, 150, 105, 0.15);
    --q-overlay-select-shadow: 0 0 12px rgba(5, 150, 105, 0.4);
    
    --q-code-bg: #f8fafc;
    --q-code-text: #0f172a;
    --q-code-keyword: #d946ef;
    --q-code-string: #059669;
    --q-code-attr: #0284c7;

    --q-shadow-panel: 0 10px 30px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(2, 132, 199, 0.2);
  }
`;

export class ThemeManager {
  constructor(targetElement = null) {
    this.targetElement = targetElement; // Shadow Root or DOM Container
    this.currentTheme = THEMES.DARK;
    this.listeners = [];
  }

  /**
   * Initializes theme from storage or system preference
   */
  async init() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([THEME_STORAGE_KEY], (res) => {
        const storedTheme = res[THEME_STORAGE_KEY] || THEMES.DARK;
        this.setTheme(storedTheme, false);
        resolve(this.currentTheme);
      });
    });
  }

  /**
   * Sets current active theme
   * @param {string} theme 'dark' | 'light' | 'system'
   * @param {boolean} persist 
   */
  setTheme(theme, persist = true) {
    this.currentTheme = theme;
    const effectiveTheme = this.getEffectiveTheme(theme);

    if (this.targetElement) {
      if (this.targetElement.host) {
        // Shadow Root host
        this.targetElement.host.setAttribute('data-theme', effectiveTheme);
      } else if (this.targetElement.setAttribute) {
        this.targetElement.setAttribute('data-theme', effectiveTheme);
      }
    }

    if (persist) {
      chrome.storage.sync.set({ [THEME_STORAGE_KEY]: theme });
    }

    this.notifyListeners(effectiveTheme);
  }

  /**
   * Resolves effective theme given system preference if set to 'system'
   * @param {string} theme 
   * @returns {string} 'dark' | 'light'
   */
  getEffectiveTheme(theme) {
    if (theme === THEMES.SYSTEM) {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? THEMES.LIGHT
        : THEMES.DARK;
    }
    return theme === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
  }

  /**
   * Toggles between dark and light themes
   */
  toggleTheme() {
    const nextTheme = this.getEffectiveTheme(this.currentTheme) === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
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
