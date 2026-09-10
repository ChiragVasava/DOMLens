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

    // Bound event handlers
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
    this.overlay = new InspectorOverlay();
    this.panel = new InspectorPanel(this.overlay.shadowRoot);

    // Register panel close callback to clear all overlays
    this.panel.onClose = () => {
      this.overlay.hideAll();
    };

    // Listen to background service worker state change messages
    chrome.runtime.onMessage.addListener(this.handleMessage);

    // Sync initial state from extension storage
    chrome.runtime.sendMessage({ action: ACTIONS.GET_INSPECT_STATE }, (res) => {
      if (res && res.active) {
        this.enable();
      }
    });

    console.log('[Qursor++] Engine initialized.');
  }

  /**
   * Enables element inspect mode
   */
  enable() {
    if (this.isActive) return;
    this.isActive = true;

    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown, true);

    document.body.style.cursor = 'crosshair';
  }

  /**
   * Disables element inspect mode
   * @param {boolean} [hideSelected=true] 
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
      this.overlay.hideHover();
    }
  }

  /**
   * Mouse movement handler (throttled visually via requestAnimationFrame in overlay)
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
   * Capture phase element click handler
   * @param {MouseEvent} e 
   */
  handleClick(e) {
    if (!this.isActive) return;

    // Ignore clicks inside floating panel
    if (e.target.closest && e.target.closest('#website-inspector-root')) {
      return;
    }

    // Intercept default page click behavior (e.g. following links, submitting forms)
    e.preventDefault();
    e.stopPropagation();

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return;

    // Highlight selected element & update panel data
    this.overlay.updateSelected(target);
    const data = extractElementData(target);
    this.panel.updateData(data, target);

    // Disable inspect hover mode after picking an element (preserve selected box)
    this.disable(false);

    // Inform background worker of state change
    chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_INSPECT });
  }

  /**
   * ESC keyboard listener to cancel inspect mode
   * @param {KeyboardEvent} e 
   */
  handleKeyDown(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      this.disable(true);
      chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_INSPECT });
    }
  }

  /**
   * Handles incoming extension message events
   */
  handleMessage(message, sender, sendResponse) {
    if (message.action === ACTIONS.INSPECT_STATE_CHANGED) {
      if (message.active) {
        this.enable();
      } else {
        this.disable(true);
      }
    } else if (message.action === ACTIONS.THEME_CHANGED) {
      if (this.panel && this.panel.themeManager) {
        this.panel.themeManager.setTheme(message.theme, false);
      }
    }
  }
}

// Singleton Engine instantiation
if (!window.__qursorEngine) {
  window.__qursorEngine = new QursorEngine();
}
