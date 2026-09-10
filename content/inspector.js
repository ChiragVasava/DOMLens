/**
 * Qursor++ - Main Content Script Orchestrator
 * 
 * Coordinates mouse hover events, capture-phase element selection,
 * keyboard shortcut handlers, overlay highlights, and floating panel display.
 */

import { ACTIONS } from '../utils/constants.js';
import { extractElementData } from './extractor.js';
import { InspectorOverlay } from './overlay.js';
import { InspectorPanel } from './panel.js';

class QursorEngine {
  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.panel = null;
    this.lastHoverElement = null;

    // Bound event handlers (for clean removeEventListener)
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMessage = this.handleMessage.bind(this);

    this.init();
  }

  /**
   * Initializes overlay, panel, and chrome runtime message listeners
   */
  init() {
    try {
      this.overlay = new InspectorOverlay();
      // The panel lives inside the SAME shadow root as the overlay boxes
      this.panel = new InspectorPanel(this.overlay.shadowRoot);

      // Register panel close callback to clear all overlays
      this.panel.onClose = () => {
        this.overlay.hideAll();
        // Notify background that inspect mode is now off
        chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_INSPECT }).catch(() => {});
      };

      // Listen to background service worker state change messages
      chrome.runtime.onMessage.addListener(this.handleMessage);

      // Sync initial state from extension storage
      chrome.runtime.sendMessage({ action: ACTIONS.GET_INSPECT_STATE }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn('[Qursor++] Could not get inspect state:', chrome.runtime.lastError.message);
          return;
        }
        if (res && res.active) {
          this.enable();
        }
      });

      console.log('[Qursor++] Engine initialized successfully.');
    } catch (err) {
      console.error('[Qursor++] Engine initialization failed:', err);
    }
  }

  /**
   * Enables element inspect mode (shows crosshair cursor, registers mouse/click handlers)
   */
  enable() {
    if (this.isActive) return;
    this.isActive = true;

    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);

    document.body.style.cursor = 'crosshair';
    console.log('[Qursor++] Inspect mode ENABLED');
  }

  /**
   * Disables element inspect mode
   * @param {boolean} [hideSelected=true] - If true, also hides selected element box and panel
   */
  disable(hideSelected = true) {
    if (!this.isActive) return;
    this.isActive = false;

    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);

    document.body.style.cursor = '';

    if (hideSelected) {
      this.overlay.hideAll();
      this.panel.hide();
    } else {
      // Keep selected highlight + panel visible — just stop hovering
      this.overlay.hideHover();
    }
    console.log('[Qursor++] Inspect mode DISABLED (hideSelected=' + hideSelected + ')');
  }

  /**
   * Mouse movement handler — updates the hover highlight box
   * @param {MouseEvent} e 
   */
  handleMouseMove(e) {
    if (!this.isActive) return;

    const target = document.elementFromPoint(e.clientX, e.clientY);

    // Ignore internal inspector host container
    if (!target || target.closest('#website-inspector-root')) {
      this.overlay.hideHover();
      return;
    }

    if (target !== this.lastHoverElement) {
      this.lastHoverElement = target;
      this.overlay.updateHover(target);
    }
  }

  /**
   * Capture phase element click handler — selects an element, shows panel
   * @param {MouseEvent} e 
   */
  handleClick(e) {
    if (!this.isActive) return;

    // Ignore clicks inside the floating panel shadow root
    if (e.target.closest && e.target.closest('#website-inspector-root')) {
      return;
    }

    // Intercept default page click behavior (e.g. following links, submitting forms)
    e.preventDefault();
    e.stopPropagation();

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest('#website-inspector-root')) return;

    // Highlight selected element & extract data
    this.overlay.updateSelected(target);
    const data = extractElementData(target);
    this.panel.updateData(data, target);

    // Disable inspect hover mode after picking an element (keep selected box visible)
    this.disable(false);

    // Inform background worker of state change (toggle off)
    chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_INSPECT }).catch(() => {});
  }

  /**
   * ESC keyboard listener to cancel inspect mode entirely
   * @param {KeyboardEvent} e 
   */
  handleKeyDown(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      this.disable(true);
      chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_INSPECT }).catch(() => {});
    }
  }

  /**
   * Handles incoming extension messages from background / popup
   * @param {Object} message
   * @param {Object} sender
   * @param {Function} sendResponse
   */
  handleMessage(message, sender, sendResponse) {
    if (!message || !message.action) return;

    switch (message.action) {
      case ACTIONS.INSPECT_STATE_CHANGED:
        if (message.active) {
          this.enable();
        } else {
          this.disable(true);
        }
        break;

      case ACTIONS.THEME_CHANGED:
        // Theme changed from popup — propagate to the panel's theme manager
        if (this.panel && this.panel.themeManager) {
          this.panel.themeManager.setTheme(message.theme, false);
          // Update theme toggle icon in panel header
          const headerBtn = this.panel.panelContainer
            ? this.panel.panelContainer.querySelector('#themeToggleBtn')
            : null;
          if (headerBtn) {
            const effective = this.panel.themeManager.getEffectiveTheme(message.theme);
            headerBtn.textContent = effective === 'dark' ? '🌙' : '☀️';
          }
        }
        break;

      default:
        break;
    }
  }
}

// ─── Singleton Engine instantiation ───
// Guard against re-instantiation on hot-reload or double injection
if (!window.__qursorEngine) {
  window.__qursorEngine = new QursorEngine();
} else {
  console.log('[Qursor++] Engine already active, skipping re-init.');
}
