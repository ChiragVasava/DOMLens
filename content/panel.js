/**
 * Qursor++ - Floating Information Panel UI (Complete Rewrite - All Features Working)
 * 
 * Full implementation with working:
 * - All 11 navigation tabs (Live, Overview, Typography, Colors, Layout, DOM, Code, Edit, Assets, Prompt, Settings)
 * - Dark/Light theme toggle (both header button and settings tab)
 * - Zoom controls in Live tab (+/-, Fit, 100%)
 * - Edit tab: Direct CSS property inputs + NLP instruction parser → applies to actual element + updates Live tab
 * - Code tab: HTML / CSS / JS / HTML+CSS+JS / React / Vue with copy & download
 * - Assets tab: Full subtree media scanner with filter tabs
 * - Prompt tab: Structured AI prompt builder with framework selector
 * - Settings tab: Theme switcher, keyboard shortcut info
 * - Draggable, resizable panel
 * - Event propagation shield (prevents GitHub/YouTube shortcuts from hijacking)
 */

import { QURSOR_NAV_TABS } from '../utils/constants.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { DESIGN_TOKENS, ThemeManager, THEMES } from '../utils/theme.js';
import { ToastManager } from '../utils/toast.js';
import { generateComponentCode, CODE_FORMATS } from '../utils/component_generator.js';
import { extractElementAssets, filterAssets } from '../utils/asset_extractor.js';
import { StyleEditor } from '../utils/style_editor.js';
import { extractElementData } from './extractor.js';
import { callLlmEditComponent, getLlmConfig, saveLlmConfig, LLM_PROVIDERS } from '../utils/llm_service.js';

export class InspectorPanel {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.panelContainer = null;
    this.currentData = null;
    this.targetElement = null;
    this.activeTab = 'live';
    this.userZoomScale = null;

    // Code tab state
    this.codeFormat = 'html+css-inline';
    this.codeScope = 'Selected';
    this.codeStyles = 'Computed';

    // Assets tab state
    this.assetFilter = 'All';

    // Edit tab state & AI Prompt
    this.styleEditor = new StyleEditor();
    this.editInstructionText = '';
    this.aiEditPromptText = '';
    this._originalOuterHTML = null;
    this.isAiGenerating = false;

    // LLM API Configuration
    this.apiKey = '';
    this.hasApiKey = false;
    this.llmProvider = LLM_PROVIDERS.GEMINI;

    // Asynchronously load saved API key
    getLlmConfig().then(cfg => {
      this.apiKey = cfg.apiKey;
      this.hasApiKey = !!cfg.apiKey;
      this.llmProvider = cfg.provider;
    });

    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.onClose = null;

    this.themeManager = new ThemeManager(shadowRoot);
    this.toastManager = new ToastManager(shadowRoot);

    this.createPanelDOM();
  }

  createPanelDOM() {
    const style = document.createElement('style');
    style.textContent = `
      ${DESIGN_TOKENS}

      * { box-sizing: border-box; }

      .qursor-floating-panel {
        position: fixed;
        /* Use right+bottom for initial position only.
           JS sets an explicit height on show() so flex:1 + min-height:0
           on the body works correctly. Dragging clears bottom/right
           and sets top/left instead. */
        bottom: 20px;
        right: 24px;
        width: 440px;
        max-width: calc(100vw - 48px);
        background: var(--q-bg-primary, #161618);
        color: var(--q-text-primary, #f5f5f7);
        border: 1px solid var(--q-border, #3a3a3c);
        border-radius: 18px;
        box-shadow: var(--q-shadow-panel);
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, sans-serif;
        font-size: 12px;
        display: none;
        flex-direction: column;
        z-index: 2147483647;
        overflow: hidden;
        pointer-events: auto !important;
        resize: both;
        min-width: 360px;
        min-height: 300px;
        max-height: calc(100vh - 40px);
        backdrop-filter: blur(20px);
        transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
      }

      /* Navigation Header — fixed height, never scrolls */
      .qursor-icon-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--q-bg-surface, #242426);
        border-bottom: 1px solid var(--q-border-subtle);
        cursor: grab;      /* signal the header is draggable */
        user-select: none;
        flex-shrink: 0;
        min-height: 42px;
      }
      .qursor-icon-navbar:active {
        cursor: grabbing;  /* while actively dragging */
      }

      .navbar-icons-group {
        display: flex;
        align-items: center;
        gap: 2px;
        overflow-x: auto;
        flex: 1;
        min-width: 0;
      }
      .navbar-icons-group::-webkit-scrollbar { height: 0; }

      .nav-icon-btn {
        background: none;
        border: none;
        color: var(--q-text-muted, #8e8e93);
        padding: 4px 7px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.15s;
        flex-shrink: 0;
      }

      .nav-icon-btn:hover {
        background: var(--q-bg-hover);
        color: var(--q-text-primary);
      }

      .nav-icon-btn.active {
        background: var(--q-bg-surface-elevated, #2c2c2e);
        color: var(--q-text-primary, #f5f5f7);
        font-weight: 700;
      }

      .nav-actions-right {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      .nav-action-btn {
        background: none;
        border: none;
        color: var(--q-text-muted);
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.15s;
      }
      .nav-action-btn:hover { color: var(--q-text-primary); background: var(--q-bg-hover); }

      /* Sub-Header Trigger / Search Bar — fixed height, never scrolls */
      .qursor-trigger-bar {
        padding: 6px 12px;
        background: var(--q-bg-primary);
        border-bottom: 1px solid var(--q-border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;   /* never shrinks */
        min-height: 44px;
      }

      .trigger-input-pill {
        background: var(--q-bg-surface, #242426);
        border: 1px solid var(--q-border, #3a3a3c);
        border-radius: 8px;
        padding: 6px 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--q-text-muted);
        font-size: 11px;
        font-weight: 500;
        width: 100%;
      }

      /* Segment Pill Controls */
      .segment-pill-container {
        display: flex;
        background: var(--q-bg-surface-elevated, #2c2c2e);
        border-radius: 8px;
        padding: 2px;
        gap: 2px;
        width: 100%;
        overflow-x: auto;
        flex-shrink: 0;
      }
      .segment-pill-container::-webkit-scrollbar { height: 0; }

      .segment-btn {
        flex: 1;
        background: none;
        border: none;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        color: var(--q-text-muted);
        cursor: pointer;
        text-align: center;
        white-space: nowrap;
        transition: all 0.15s;
      }

      .segment-btn.active {
        background: var(--q-bg-surface, #242426);
        color: var(--q-text-primary, #f5f5f7);
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      }

      /* Zoom Controls Bar */
      .zoom-controls-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .zoom-btn {
        background: var(--q-bg-surface);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 4px;
        padding: 2px 7px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
      }
      .zoom-btn:hover { background: var(--q-bg-surface-elevated); }

      /* ================================================================
         PANEL BODY — THE SCROLLABLE AREA
         ================================================================
         Pattern: Panel has explicit JS-set height, flex:1+min-height:0
         on body ensures scroll works. Background inherits from theme.
         ================================================================ */
      .qursor-panel-body {
        flex: 1 1 0;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        /* Body background matches the panel theme —
           dark mode = near-black (#161618), light mode = near-white (#f5f5f7) */
        background: var(--q-bg-primary, #161618);
      }

      /* Slim, themed scrollbar for the panel body */
      .qursor-panel-body::-webkit-scrollbar {
        width: 4px;
      }
      .qursor-panel-body::-webkit-scrollbar-track {
        background: transparent;
        margin: 10px 0;
      }
      .qursor-panel-body::-webkit-scrollbar-thumb {
        background: var(--q-border, #3a3a3c);
        border-radius: 4px;
      }
      .qursor-panel-body::-webkit-scrollbar-thumb:hover {
        background: var(--q-text-muted, #8e8e93);
      }

      .section-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: var(--q-text-muted, #86868b);
        text-transform: uppercase;
      }

      .node-badge {
        background: var(--q-bg-surface-elevated);
        color: var(--q-text-muted);
        border-radius: 10px;
        padding: 1px 6px;
        font-size: 9px;
      }

      .qursor-card {
        background: var(--q-bg-surface, #ffffff);
        border: 1px solid var(--q-border, #e5e5ea);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow: hidden;
      }

      /* Property Table */
      .prop-grid {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .prop-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        gap: 8px;
      }

      .prop-label {
        color: var(--q-text-muted);
        font-weight: 500;
        min-width: 100px;
        flex-shrink: 0;
      }

      .prop-value {
        color: var(--q-text-primary);
        font-weight: 600;
        font-family: SFMono-Regular, Consolas, monospace;
        display: flex;
        align-items: center;
        gap: 4px;
        word-break: break-all;
        overflow-wrap: anywhere;
        max-width: 230px;
        text-align: right;
        justify-content: flex-end;
        flex: 1;
      }

      /* Asset Grid */
      .asset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 8px;
      }

      .asset-card-item {
        background: var(--q-bg-surface);
        border: 1px solid var(--q-border);
        border-radius: 8px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: center;
      }

      .asset-preview-card {
        background-color: #ffffff;
        background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                          linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                          linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 14px 14px;
        border-radius: 6px;
        width: 100%;
        height: 75px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--q-border);
        overflow: hidden;
      }

      /* Spacing Diagram */
      .spacing-diagram {
        background: var(--q-bg-primary);
        border: 1px dashed var(--q-border);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        font-family: monospace;
        font-size: 10px;
      }

      /* Edit inputs */
      .edit-prop-input {
        background: var(--q-bg-primary);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 5px;
        padding: 3px 6px;
        font-size: 11px;
        font-family: monospace;
        width: 120px;
        text-align: right;
        outline: none;
      }
      .edit-prop-input:focus {
        border-color: var(--q-accent);
      }

      /* Action buttons */
      .icon-action-btn {
        background: none;
        border: none;
        color: var(--q-text-muted);
        cursor: pointer;
        padding: 3px 6px;
        font-size: 11px;
        border-radius: 4px;
        transition: all 0.15s;
      }
      .icon-action-btn:hover { color: var(--q-text-primary); background: var(--q-bg-hover); }

      .q-btn {
        padding: 5px 12px;
        border-radius: 6px;
        border: 1px solid var(--q-border);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        background: var(--q-bg-surface-elevated);
        color: var(--q-text-primary);
        transition: all 0.15s;
      }
      .q-btn:hover { background: var(--q-bg-hover); }

      .q-btn-primary {
        background: var(--q-accent, #2563eb) !important;
        color: #ffffff !important;
        border-color: var(--q-accent, #2563eb) !important;
      }
      .q-btn-primary:hover { background: var(--q-accent-hover, #1d4ed8) !important; }

      /* Textareas in panel */
      .q-textarea {
        width: 100%;
        background: var(--q-bg-primary);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 6px;
        padding: 8px;
        font-family: SFMono-Regular, Consolas, monospace;
        font-size: 10px;
        outline: none;
        resize: vertical;
        transition: border-color 0.15s;
      }
      .q-textarea:focus { border-color: var(--q-accent); }

      /* Color swatch */
      .color-swatch {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        border: 1px solid rgba(128,128,128,0.3);
        display: inline-block;
        vertical-align: middle;
        flex-shrink: 0;
      }

      /* Empty state */
      .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: var(--q-text-muted);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .empty-state-icon { font-size: 32px; }
      .empty-state-title { font-weight: 700; color: var(--q-text-primary); font-size: 13px; }
      .empty-state-desc { font-size: 11px; }
    `;

    this.shadowRoot.appendChild(style);

    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'qursor-floating-panel';
    this.panelContainer.setAttribute('data-theme', THEMES.DARK);

    this.panelContainer.innerHTML = `
      <!-- Top Icon Navigation Header -->
      <div class="qursor-icon-navbar" id="panelHeader">
        <div class="navbar-icons-group" id="navIconsGroup">
          ${QURSOR_NAV_TABS.map(tab => `
            <button class="nav-icon-btn ${tab.id === this.activeTab ? 'active' : ''}" data-tab="${tab.id}" title="${tab.label}">
              <span>${tab.icon}</span>
              <span>${tab.label}</span>
            </button>
          `).join('')}
        </div>
        <div class="nav-actions-right">
          <button class="nav-action-btn" id="themeToggleBtn" title="Toggle Dark/Light Theme">☀️</button>
          <button class="nav-action-btn" id="panelCloseBtn" title="Close Panel">✕</button>
        </div>
      </div>

      <!-- Sub-Header Trigger / Search Bar -->
      <div class="qursor-trigger-bar" id="triggerBar">
        <div class="trigger-input-pill">
          <span>🔍 Click any element on webpage to inspect</span>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="qursor-panel-body" id="panelBody">
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-title">No Element Selected</div>
          <div class="empty-state-desc">Click any element to inspect live preview, overview, code, edits, assets, or prompts.</div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(this.panelContainer);

    // Initialize theme from storage (async).
    // If no theme was saved yet, auto-detect from the page's color scheme.
    this.themeManager.init().then((theme) => {
      // If first run (no stored pref), match the website's color scheme
      chrome.storage.sync.get(['qursor_theme_preference'], (res) => {
        let resolvedTheme = theme;
        if (!res['qursor_theme_preference']) {
          // Auto-detect: use the page's preferred color scheme
          const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
          resolvedTheme = prefersLight ? THEMES.LIGHT : THEMES.DARK;
          this.themeManager.setTheme(resolvedTheme, true); // persist for next time
        }
        // Update the theme toggle button:
        // ☀️ = currently dark  (click to go light)
        // 🌙 = currently light (click to go dark)
        const btn = this.panelContainer.querySelector('#themeToggleBtn');
        if (btn) btn.textContent = resolvedTheme === THEMES.DARK ? '☀️' : '🌙';
      });
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    const header = this.panelContainer.querySelector('#panelHeader');
    const closeBtn = this.panelContainer.querySelector('#panelCloseBtn');
    const themeToggleBtn = this.panelContainer.querySelector('#themeToggleBtn');
    const navGroup = this.panelContainer.querySelector('#navIconsGroup');

    // ─── Host Site Event Propagation Shield ───
    // Prevents GitHub/YouTube shortcuts from hijacking inputs inside the panel
    ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress', 'input', 'change'].forEach(evtType => {
      this.panelContainer.addEventListener(evtType, (e) => {
        e.stopPropagation();
      });
    });

    // ─── Dragging Logic ───
    // Drag is ONLY active while the mouse button is held (mousedown→mouseup).
    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking nav buttons or action buttons
      if (e.target.closest('.nav-icon-btn') || e.target.closest('.nav-action-btn')) return;
      e.preventDefault(); // Prevent browser text-selection from capturing cursor
      this.isDragging = true;
      this.panelContainer.style.userSelect = 'none';
      this.panelContainer.style.cursor = 'grabbing';
      header.style.cursor = 'grabbing';
      const rect = this.panelContainer.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      // Freeze current position as top/left and release bottom/right anchors
      this.panelContainer.style.top = `${rect.top}px`;
      this.panelContainer.style.left = `${rect.left}px`;
      this.panelContainer.style.bottom = 'auto';
      this.panelContainer.style.right = 'auto';
    });

    // mousemove on window so drag works even when mouse is outside the panel
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;  // ← only fires during mousedown state
      e.preventDefault();
      const panelW = this.panelContainer.offsetWidth;
      const panelH = this.panelContainer.offsetHeight;
      const left = Math.max(0, Math.min(window.innerWidth - panelW, e.clientX - this.dragOffsetX));
      const top  = Math.max(0, Math.min(window.innerHeight - panelH, e.clientY - this.dragOffsetY));
      this.panelContainer.style.left = `${left}px`;
      this.panelContainer.style.top  = `${top}px`;
    });

    // Drag stops on any of three events:
    //  1. mouseup    — mouse button released anywhere
    //  2. window.mouseleave — cursor exited the browser window
    //  3. panelContainer.mouseleave — cursor left the pop-up panel itself
    const stopDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.panelContainer.style.userSelect = '';
      this.panelContainer.style.cursor = '';
      header.style.cursor = 'grab';  // restore grab hint on header
    };
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('mouseleave', stopDrag);
    // Stop drag the moment the cursor leaves the pop-up panel boundary
    this.panelContainer.addEventListener('mouseleave', stopDrag);

    // ─── Theme Toggle Button (header) ───
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._doToggleTheme(themeToggleBtn);
    });

    // ─── Close Button ───
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      if (this.onClose) this.onClose();
    });

    // ─── Navigation Tab Switch ───
    navGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-icon-btn');
      if (!btn) return;
      e.stopPropagation();
      const tabId = btn.dataset.tab;
      this.activeTab = tabId;
      this._updateNavHighlight();
      this.renderTabContent();
    });

    // ─── Delegated Click Handler for Panel Body / Trigger Bar ───
    this.panelContainer.addEventListener('click', async (e) => {
      const segBtn = e.target.closest('.segment-btn');
      const zoomBtn = e.target.closest('.zoom-btn');
      const copyBtn = e.target.closest('.copy-action-trigger');
      const downloadBtn = e.target.closest('.download-action-trigger');

      // Segment / Filter buttons
      if (segBtn) {
        e.stopPropagation();
        const segGroup = segBtn.dataset.segGroup;
        const value = segBtn.dataset.segValue;
        if (segGroup === 'codeFormat') this.codeFormat = value;
        if (segGroup === 'codeScope') this.codeScope = value;
        if (segGroup === 'codeStyles') this.codeStyles = value;
        if (segGroup === 'assetFilter') this.assetFilter = value;
        this.renderTabContent();
        return;
      }

      // Zoom controls
      if (zoomBtn && this.currentData) {
        e.stopPropagation();
        const action = zoomBtn.dataset.zoomAction;
        const targetWidth = (this.currentData.widthPx && this.currentData.widthPx > 50) ? this.currentData.widthPx : 420;
        const targetHeight = (this.currentData.heightPx && this.currentData.heightPx > 50) ? this.currentData.heightPx : 300;
        const autoScale = parseFloat(Math.min(390 / targetWidth, 240 / targetHeight, 1.0).toFixed(3));
        let currentZoom = (this.userZoomScale !== null) ? this.userZoomScale : autoScale;

        if (action === 'in') this.userZoomScale = parseFloat(Math.min(3.0, currentZoom + 0.15).toFixed(2));
        else if (action === 'out') this.userZoomScale = parseFloat(Math.max(0.1, currentZoom - 0.15).toFixed(2));
        else if (action === 'fit') this.userZoomScale = autoScale;
        else if (action === 'reset') this.userZoomScale = 1.0;

        this.renderTabContent();
        return;
      }

      // AI Apply Edit button in Edit tab
      if (e.target.closest('#applyAiEditBtn')) {
        e.stopPropagation();
        this._handleAiEdit();
        return;
      }

      // Direct manual edits Apply button
      if (e.target.closest('#applyEditBtn')) {
        e.stopPropagation();
        this._applyEdits();
        return;
      }

      // Reset / Revert Edits button
      if (e.target.closest('#resetEditBtn')) {
        e.stopPropagation();
        if (this._originalOuterHTML && this.targetElement && this.targetElement.parentNode) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = this._originalOuterHTML;
          const origEl = tempDiv.firstElementChild;
          if (origEl) {
            this.targetElement.parentNode.replaceChild(origEl, this.targetElement);
            this.targetElement = origEl;
            this.currentData = extractElementData(origEl);
            this._originalOuterHTML = null;
          }
        }
        if (this.targetElement) {
          this.targetElement.removeAttribute('style');
        }
        this.styleEditor.reset();
        this.editInstructionText = '';
        this.aiEditPromptText = '';
        this.toastManager.show('✓ Component reverted to original', 'info');
        this.renderTabContent();
        return;
      }

      // Quick shortcut to Settings tab for API Key
      if (e.target.closest('#editApiKeyQuickBtn')) {
        e.stopPropagation();
        this.activeTab = 'settings';
        this._updateNavHighlight();
        this.renderTabContent();
        return;
      }

      // Save API Key button in Settings
      if (e.target.closest('#saveApiKeyBtn')) {
        e.stopPropagation();
        this._handleSaveApiKey();
        return;
      }

      // Toggle API Key visibility in Settings
      if (e.target.closest('#toggleApiKeyVisibilityBtn')) {
        e.stopPropagation();
        this._toggleApiKeyVisibility();
        return;
      }

      // Settings Theme Toggle
      if (e.target.closest('#settingsThemeToggleBtn')) {
        e.stopPropagation();
        const btn = this.panelContainer.querySelector('#themeToggleBtn');
        this._doToggleTheme(btn);
        this.renderTabContent();
        return;
      }

      // Copy Action
      if (copyBtn) {
        e.stopPropagation();
        const text = copyBtn.dataset.copyText;
        if (text) {
          await copyToClipboard(decodeHTMLEntities(text));
          this.toastManager.show('✓ Copied to clipboard!', 'success');
        }
        return;
      }

      // Download Action
      if (downloadBtn && this.currentData) {
        e.stopPropagation();
        const content = this.codeFormat === 'html+css-inline'
          ? (this.codeScope === 'Full Page' ? this.generateInlineCssHtml(document.body) : (this.generateInlineCssHtml(this.targetElement) || this.currentData.general?.fullOuterHTML || ''))
          : generateComponentCode(this.currentData, this.codeFormat);
        const ext = this.codeFormat === CODE_FORMATS.REACT ? 'jsx' : 'html';
        this.downloadFile(content, `qursor_${(this.currentData.tag || 'element').toLowerCase()}.${ext}`);
        this.toastManager.show(`✓ Downloaded file`, 'success');
        return;
      }
    });

    // ─── Live input handler for Edit tab inline fields ───
    this.panelContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('edit-prop-input')) {
        e.stopPropagation();
        const prop = e.target.dataset.styleProp;
        const val = e.target.value.trim();
        if (prop && val && this.targetElement) {
          try {
            this.targetElement.style[prop] = val;
          } catch (err) {
            // ignore invalid values during typing
          }
        }
      }
    });

    // ─── Select change handler for Settings LLM provider ───
    this.panelContainer.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'settingsLlmProvider') {
        e.stopPropagation();
        this.llmProvider = e.target.value;
      }
    });
  }

  // ─── Internal helpers ───

  _doToggleTheme(headerBtn) {
    const newTheme = this.themeManager.toggleTheme();
    // ☀️ = currently dark  (click to go light)
    // 🌙 = currently light (click to go dark)
    const icon = newTheme === THEMES.DARK ? '☀️' : '🌙';
    this.panelContainer.querySelectorAll('#themeToggleBtn').forEach(btn => {
      btn.textContent = icon;
    });
    // Re-render so all inline values reflect the new theme
    this.renderTabContent();
    this.toastManager.show(`Switched to ${newTheme === THEMES.DARK ? 'Dark 🌑' : 'Light ☀️'} mode`, 'info');
  }

  _updateNavHighlight() {
    const navGroup = this.panelContainer.querySelector('#navIconsGroup');
    if (navGroup) {
      navGroup.querySelectorAll('.nav-icon-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === this.activeTab);
      });
    }
  }

  _applyEdits() {
    const textarea = this.panelContainer.querySelector('#editInstructionArea');
    const instruction = textarea ? textarea.value.trim() : '';

    // Read all direct input fields
    const inputs = this.panelContainer.querySelectorAll('.edit-prop-input');
    inputs.forEach(input => {
      const prop = input.dataset.styleProp;
      const val = input.value.trim();
      if (prop && val) {
        this.styleEditor.setStyle(prop, val);
      }
    });

    // Parse NLP instruction
    if (instruction) {
      this.editInstructionText = instruction;
      this.styleEditor.parseAndApplyInstruction(instruction);
    }

    // Apply to actual DOM element
    if (this.targetElement) {
      // Apply CSS styles
      Object.entries(this.styleEditor.customStyles).forEach(([p, v]) => {
        try { this.targetElement.style[p] = v; } catch (e) { /* skip */ }
      });

      // Apply text content if specified
      if (this.styleEditor.customText) {
        const tag = this.targetElement.tagName.toLowerCase();
        const textTags = ['p', 'span', 'a', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'label', 'td', 'th', 'div'];
        if (textTags.includes(tag) || this.targetElement.childElementCount === 0) {
          this.targetElement.textContent = this.styleEditor.customText;
        }
      }

      // Update currentData so Live tab reflects changes
      if (this.currentData) {
        this.currentData.rawCss = this.styleEditor.applyToRawCss(this.currentData.rawCss || '');
        if (this.currentData.general) {
          if (this.styleEditor.customText) {
            this.currentData.general.textContent = this.styleEditor.customText;
          }
          this.currentData.general.fullOuterHTML = this.targetElement.outerHTML;
        }
      }
    }

    this.toastManager.show('✓ Edits applied! Switching to Live view...', 'success');
    this.activeTab = 'live';
    this._updateNavHighlight();
    this.renderTabContent();
  }

  // ─── Public API ───

  updateData(data, element = null) {
    this.currentData = data;
    this.targetElement = element;
    this.userZoomScale = null;
    this.styleEditor.reset();
    this.editedPromptText = null;
    this.editInstructionText = '';
    this._originalOuterHTML = null;
    if (!data) return;
    this.show();
    this.renderTabContent();
  }

  /**
   * Generates a self-contained HTML string of an element and its subtree
   * with all computed visual CSS properties inlined directly on each node.
   * Resolves relative URLs (images, links) and strips non-rendering tags like <script>.
   */
  generateInlineCssHtml(el) {
    if (!el || el.nodeType !== 1) return el ? (el.outerHTML || '') : '';
    try {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('script, noscript').forEach(s => s.remove());

      const allEls = [el, ...el.querySelectorAll('*')];
      const cloneEls = [clone, ...clone.querySelectorAll('*')];

      const PROPS = [
        'box-sizing',
        'color', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
        'font-size', 'font-weight', 'font-family', 'font-style',
        'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-transform', 'text-overflow', 'white-space', 'word-break',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-radius', 'border-color', 'border-width', 'border-style',
        'box-shadow', 'opacity', 'visibility',
        'display', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
        'align-items', 'justify-content', 'align-content', 'align-self', 'gap', 'row-gap', 'column-gap',
        'grid-template-columns', 'grid-template-rows',
        'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
        'position', 'top', 'left', 'right', 'bottom', 'z-index',
        'overflow', 'overflow-x', 'overflow-y',
        'cursor', 'pointer-events',
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'transform', 'transform-origin', 'backdrop-filter', 'object-fit', 'aspect-ratio', 'list-style'
      ];

      allEls.forEach((orig, i) => {
        const target = cloneEls[i];
        if (!target) return;

        // Resolve absolute URLs for images, links, etc.
        if (orig.tagName === 'IMG' && orig.src) {
          target.setAttribute('src', orig.src);
        } else if (orig.tagName === 'A' && orig.href) {
          target.setAttribute('href', orig.href);
          target.setAttribute('target', '_blank');
        } else if (orig.tagName === 'SOURCE' && orig.srcset) {
          target.setAttribute('srcset', orig.srcset);
        }

        const cs = window.getComputedStyle(orig);
        const styleParts = [];

        PROPS.forEach(p => {
          let v = cs.getPropertyValue(p);
          if (!v || v === '' || v === 'none' || v === 'normal' || v === 'auto' || v === '0px' || v === 'rgba(0, 0, 0, 0)') {
            return;
          }
          if (p === 'position' && v === 'static') return;
          // For root element (i === 0), avoid fixed positioning in preview/export
          if (i === 0 && p === 'position' && (v === 'fixed' || v === 'absolute')) {
            v = 'relative';
          }
          styleParts.push(`${p}:${v}`);
        });

        if (styleParts.length > 0) {
          target.setAttribute('style', styleParts.join('; '));
        }
      });

      return clone.outerHTML;
    } catch (e) {
      console.warn('[Qursor++] Failed to generate inline CSS HTML:', e);
      return el.outerHTML || '';
    }
  }

  /**
   * Invokes the LLM to edit the currently selected component
   */
  async _handleAiEdit() {
    const promptArea = this.panelContainer.querySelector('#aiEditPromptArea');
    const prompt = promptArea ? promptArea.value.trim() : '';

    if (!prompt) {
      this.toastManager.show('⚠️ Please type an instruction for the AI', 'warning');
      if (promptArea) promptArea.focus();
      return;
    }

    const config = await getLlmConfig();
    if (!config.apiKey) {
      this.toastManager.show('⚠️ Please configure your API Key in Settings first', 'warning');
      this.activeTab = 'settings';
      this._updateNavHighlight();
      this.renderTabContent();
      return;
    }

    const applyBtn = this.panelContainer.querySelector('#applyAiEditBtn');
    const originalBtnText = applyBtn ? applyBtn.innerHTML : '⚡ Apply with AI';

    try {
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.innerHTML = '<span>⏳ Generating with AI...</span>';
      }
      this.isAiGenerating = true;

      // Extract current HTML with computed visual styles
      const currentHtml = this.generateInlineCssHtml(this.targetElement) || (this.currentData?.general?.fullOuterHTML) || '';
      const tag = (this.currentData?.tag || 'div').toLowerCase();

      // Save original for revert
      if (!this._originalOuterHTML && this.targetElement) {
        this._originalOuterHTML = this.targetElement.outerHTML;
      }

      // Call the LLM
      const updatedHtml = await callLlmEditComponent({
        prompt,
        currentHtml,
        componentTag: tag
      });

      if (!updatedHtml) {
        throw new Error('Received empty HTML from AI model');
      }

      // Replace element on the live webpage
      if (this.targetElement && this.targetElement.parentNode) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedHtml;
        const newEl = tempDiv.firstElementChild;
        if (newEl) {
          this.targetElement.parentNode.replaceChild(newEl, this.targetElement);
          this.targetElement = newEl;
        } else {
          this.targetElement.innerHTML = updatedHtml;
        }
      }

      // Extract fresh data from the updated element
      if (this.targetElement) {
        this.currentData = extractElementData(this.targetElement);
      }

      this.aiEditPromptText = prompt;
      this.toastManager.show('✨ Component updated with AI! Switched to Live view', 'success');

      // Switch to Live Preview tab to show the re-rendered component
      this.activeTab = 'live';
      this._updateNavHighlight();
      this.renderTabContent();

    } catch (err) {
      console.error('[Qursor++] AI Edit Error:', err);
      this.toastManager.show(`❌ AI Error: ${err.message}`, 'error');
    } finally {
      this.isAiGenerating = false;
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.innerHTML = originalBtnText;
      }
    }
  }

  async _handleSaveApiKey() {
    const input = this.panelContainer.querySelector('#settingsApiKeyInput');
    const providerSelect = this.panelContainer.querySelector('#settingsLlmProvider');
    const key = input ? input.value.trim() : '';
    const provider = providerSelect ? providerSelect.value : this.llmProvider;

    if (!key) {
      this.toastManager.show('⚠️ API key cannot be empty', 'warning');
      return;
    }

    await saveLlmConfig(key, provider);
    this.apiKey = key;
    this.hasApiKey = true;
    this.llmProvider = provider;

    this.toastManager.show(`✓ ${provider.toUpperCase()} API key saved securely!`, 'success');
    this.renderTabContent();
  }

  _toggleApiKeyVisibility() {
    const input = this.panelContainer.querySelector('#settingsApiKeyInput');
    const btn = this.panelContainer.querySelector('#toggleApiKeyVisibilityBtn');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.textContent = '🙈';
    } else {
      input.type = 'password';
      if (btn) btn.textContent = '👁️';
    }
  }

  show() {
    if (!this.panelContainer) return;
    this.panelContainer.style.display = 'flex';
    // Set explicit pixel height so flex:1 + min-height:0 on the body works
    // for scrolling. Only set it on first show (or after hide resets it).
    if (!this.panelContainer.style.height || this.panelContainer.style.height === '') {
      const h = Math.min(window.innerHeight - 40, 660);
      this.panelContainer.style.height = `${h}px`;
    }
  }

  hide() {
    if (this.panelContainer) this.panelContainer.style.display = 'none';
  }

  // ─── Tab Content Renderer ───

  renderTabContent() {
    const triggerBar = this.panelContainer.querySelector('#triggerBar');
    const body = this.panelContainer.querySelector('#panelBody');
    if (!body || !triggerBar) return;

    if (!this.currentData) {
      triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🔍 Click any element on webpage to inspect</span></div>`;
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-title">No Element Selected</div>
          <div class="empty-state-desc">Click any element to inspect live preview, overview, code, edits, assets, or prompts.</div>
        </div>`;
      return;
    }

    const d = this.currentData;
    // Safe defaults for all data groups
    const general = d.general || { tagName: 'DIV', id: 'N/A', classList: [], role: 'N/A', accessibleName: 'N/A', value: 'N/A', textContent: '', fullOuterHTML: '' };
    const typography = d.typography || { fontFamily: 'system-ui, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: 'normal', letterSpacing: 'normal', textAlign: 'left', textTransform: 'none', textDecoration: 'none', wordSpacing: 'normal' };
    const colors = d.colors || { color: '#000000', backgroundColor: '#ffffff', hexColor: '#000000', hexBgColor: '#ffffff', hexBorderColor: '#cccccc', boxShadow: 'none', opacity: '1' };
    const spacing = d.spacing || { margin: '0px', padding: '0px', gap: 'normal', marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px', paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px' };
    const layout = d.layout || { display: 'block', position: 'static', zIndex: 'auto', boxSizing: 'border-box', overflow: 'visible', visibility: 'visible', opacity: '1' };
    const dom = d.dom || { parentTag: 'body', parentId: '', depth: 1, childrenCount: 0, childTags: [], previousSiblingTag: 'None', nextSiblingTag: 'None' };
    const border = d.border || { borderRadius: '0px', borderWidth: '0px', borderStyle: 'none', borderColor: 'transparent' };
    const flexGrid = d.flexGrid || { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-start', flexWrap: 'nowrap', gap: '0px', gridTemplateColumns: 'N/A', gridTemplateRows: 'N/A' };
    const classes = d.classes || [];

    // Pre-compute hex colors
    const hexColor = colors.hexColor || _rgbToHex(colors.color) || '#000000';
    const hexBg = colors.hexBgColor || _rgbToHex(colors.backgroundColor) || '#FFFFFF';
    const hexBorder = colors.hexBorderColor || _rgbToHex(colors.borderColor || border.borderColor) || '#CCCCCC';

    switch (this.activeTab) {
      // ══════════════════════════════════════════════
      // 1. LIVE TAB
      // ══════════════════════════════════════════════
      case 'live':
      case 'preview': {
        const targetWidth = (d.widthPx && d.widthPx > 10) ? d.widthPx : 400;
        const targetHeight = (d.heightPx && d.heightPx > 10) ? d.heightPx : 300;
        const autoScale = parseFloat(Math.min(390 / targetWidth, 240 / targetHeight, 1.0).toFixed(3));
        const activeZoom = (this.userZoomScale !== null) ? this.userZoomScale : autoScale;
        const scalePercent = Math.round(activeZoom * 100);

        triggerBar.innerHTML = `
          <div class="trigger-input-pill" style="justify-content:space-between;">
            <span>👁️ Live Component Preview</span>
            <div class="zoom-controls-group">
              <button class="zoom-btn" data-zoom-action="out" title="Zoom Out">−</button>
              <button class="zoom-btn" data-zoom-action="fit" title="Fit to Panel">Fit</button>
              <button class="zoom-btn" data-zoom-action="reset" title="100%">100%</button>
              <button class="zoom-btn" data-zoom-action="in" title="Zoom In">+</button>
              <span style="font-size:9px; background:var(--q-bg-surface-elevated); padding:2px 6px; border-radius:4px; font-weight:700; color:var(--q-text-primary);">${scalePercent}%</span>
            </div>
          </div>
        `;

        // Render the extracted HTML + CSS of our selected component code
        let renderableHtml = '';
        if (this.targetElement) {
          renderableHtml = this.generateInlineCssHtml(this.targetElement);
        }
        if (!renderableHtml) {
          renderableHtml = general.fullOuterHTML || '';
        }

        const lowerTag = (general.tagName || '').toLowerCase();
        if (lowerTag === 'td' || lowerTag === 'th') {
          renderableHtml = `<table style="border-collapse:collapse;"><tbody><tr>${renderableHtml}</tr></tbody></table>`;
        } else if (lowerTag === 'tr') {
          renderableHtml = `<table style="border-collapse:collapse;"><tbody>${renderableHtml}</tbody></table>`;
        } else if (lowerTag === 'li') {
          renderableHtml = `<ul style="margin:0; padding:0 0 0 20px; list-style:disc;">${renderableHtml}</ul>`;
        }

        const bgIsDark = this.themeManager.isDark();
        const iframeBg = bgIsDark ? '#1a1a1d' : '#ffffff';

        const iframeSrc = `<!DOCTYPE html><html><head><meta charset="utf-8">
          <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 16px;
              background: ${iframeBg};
              overflow: auto;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .preview-wrap {
              width: ${targetWidth}px;
              transform: scale(${activeZoom});
              transform-origin: top center;
              max-width: 100%;
            }
          </style>
          ${d.pageStyles || ''}
        </head><body><div class="preview-wrap">${renderableHtml}</div></body></html>`;

        body.innerHTML = `
          <div class="section-label-row">
            <span>COMPONENT LIVE FRAME (HTML + CSS)</span>
            <span class="node-badge">${targetWidth}×${targetHeight}px</span>
          </div>
          <div class="qursor-card" style="padding:4px;">
            <iframe id="livePreviewFrame" style="width:100%;height:260px;border:none;border-radius:8px;background:var(--q-bg-surface);" srcdoc="${_escapeAttr(iframeSrc)}"></iframe>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 2. OVERVIEW TAB
      // ══════════════════════════════════════════════
      case 'overview': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>ⓘ Detailed Overview &amp; Metrics</span></div>`;
        body.innerHTML = `
          <div class="section-label-row">
            <span>ELEMENT SUMMARY</span>
            <span class="node-badge">&lt;${d.tag || 'DIV'}&gt;</span>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:4px;">General Attributes</div>
            <div class="prop-grid">
              ${_propRow('Tag Name', `&lt;${_esc(general.tagName || 'DIV')}&gt;`)}
              ${_propRow('Element ID', _esc(general.id || 'N/A'))}
              ${_propRow('CSS Classes', classes.length ? _esc(classes.join(', ')) : '<em style="opacity:0.5">None</em>')}
              ${_propRow('ARIA Role', _esc(general.role || 'N/A'))}
              ${_propRow('Accessible Name', _esc(general.accessibleName || 'N/A'))}
              ${_propRow('Value / Input', _esc(general.value || 'N/A'))}
              ${_propRow('Tab Index', String(general.tabIndex ?? 'N/A'))}
              ${_propRow('Content Editable', String(general.isContentEditable || false))}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:4px;">Quick Styles &amp; Colors</div>
            <div class="prop-grid">
              ${_propRow('Font Family', _esc((typography.fontFamily || 'Inherit').split(',')[0].replace(/['"]/g, '')))}
              ${_propRow('Font Size / Weight', `${typography.fontSize || '16px'} / ${typography.fontWeight || '400'}`)}
              ${_propRow('Line Height', typography.lineHeight || 'normal')}
              ${_propRow('Text Color', `<span class="color-swatch" style="background:${hexColor};"></span> <span class="copy-action-trigger" data-copy-text="${hexColor}" style="cursor:pointer;" title="Copy">${hexColor} 📋</span>`)}
              ${_propRow('Background', `<span class="color-swatch" style="background:${hexBg};"></span> <span class="copy-action-trigger" data-copy-text="${hexBg}" style="cursor:pointer;" title="Copy">${hexBg} 📋</span>`)}
              ${_propRow('Dimensions', `${d.widthPx || 0} × ${d.heightPx || 0}px`)}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:4px;">Text Content</div>
            <div style="font-size:11px;color:var(--q-text-secondary);word-break:break-word;max-height:80px;overflow:auto;line-height:1.5;">
              ${_esc(general.textContent ? general.textContent.substring(0, 300) : 'No text content')}
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 3. TYPOGRAPHY TAB
      // ══════════════════════════════════════════════
      case 'typography': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>T Typography &amp; Font Specimen</span></div>`;
        const fontFam = (typography.fontFamily || 'system-ui').split(',')[0].replace(/['"]/g, '').trim();

        body.innerHTML = `
          <div class="section-label-row">
            <span>FONT SPECIMEN &amp; METRICS</span>
            <span class="node-badge">&lt;${d.tag || 'DIV'}&gt;</span>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Live Specimen Render</div>
            <div style="
              font-family:${_esc(typography.fontFamily || 'sans-serif')};
              font-size:${typography.fontSize || '16px'};
              font-weight:${typography.fontWeight || '400'};
              color:${hexColor};
              background:${hexBg};
              padding:14px;
              border-radius:6px;
              border:1px solid var(--q-border);
              text-align:center;
              overflow:hidden;
              text-overflow:ellipsis;
              white-space:nowrap;
              line-height:${typography.lineHeight || 'normal'};
              letter-spacing:${typography.letterSpacing || 'normal'};
            ">
              ${_esc(general.textContent ? general.textContent.substring(0, 60) : 'AaBbCcDdEeFfGgHh 1234567890')}
            </div>
          </div>
          <div class="qursor-card">
            <div class="prop-grid">
              ${_propRow('Primary Font', _esc(fontFam))}
              ${_propRow('Full Font Stack', _esc(typography.fontFamily || 'Inherit'))}
              ${_propRow('Font Size', typography.fontSize || '16px')}
              ${_propRow('Font Weight', typography.fontWeight || '400')}
              ${_propRow('Line Height', typography.lineHeight || 'normal')}
              ${_propRow('Letter Spacing', typography.letterSpacing || 'normal')}
              ${_propRow('Word Spacing', typography.wordSpacing || 'normal')}
              ${_propRow('Text Align', typography.textAlign || 'left')}
              ${_propRow('Text Transform', typography.textTransform || 'none')}
              ${_propRow('Text Decoration', typography.textDecoration || 'none')}
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 4. COLORS TAB
      // ══════════════════════════════════════════════
      case 'colors': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🎨 Color Palette &amp; Swatches</span></div>`;

        const colorSwatchCard = (label, hex, raw) => `
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">${label}</div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <div style="width:40px;height:40px;border-radius:8px;background:${hex};border:1px solid rgba(128,128,128,0.3);flex-shrink:0;"></div>
              <div>
                <div style="font-family:monospace;font-size:12px;font-weight:700;color:var(--q-text-primary);">${hex}</div>
                <div style="font-size:10px;color:var(--q-text-muted);">${_esc(raw || hex)}</div>
              </div>
              <button class="icon-action-btn copy-action-trigger" data-copy-text="${hex}" style="margin-left:auto;" title="Copy hex">📋 Copy</button>
            </div>
          </div>`;

        body.innerHTML = `
          <div class="section-label-row">
            <span>COLOR TELEMETRY &amp; SWATCHES</span>
            <span class="node-badge">&lt;${d.tag || 'DIV'}&gt;</span>
          </div>
          ${colorSwatchCard('Text Color', hexColor, colors.color)}
          ${colorSwatchCard('Background Color', hexBg, colors.backgroundColor)}
          ${colorSwatchCard('Border Color', hexBorder, colors.borderColor || border.borderColor)}
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Other Visual Properties</div>
            <div class="prop-grid">
              ${_propRow('Box Shadow', _esc(colors.boxShadow || 'none'))}
              ${_propRow('Opacity', colors.opacity || '1')}
              ${_propRow('Outline Color', _esc(colors.outlineColor || 'N/A'))}
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 5. LAYOUT TAB
      // ══════════════════════════════════════════════
      case 'layout': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>📐 Layout Architecture &amp; Box Model</span></div>`;

        body.innerHTML = `
          <div class="section-label-row">
            <span>BOX MODEL &amp; SPACING</span>
            <span class="node-badge">${d.widthPx || 0}×${d.heightPx || 0}px</span>
          </div>
          <div class="qursor-card">
            <div class="spacing-diagram">
              <div style="width:100%;padding:8px;background:rgba(249,115,22,0.1);border:1px dashed #f97316;border-radius:6px;text-align:center;font-size:9px;color:var(--q-text-primary);">
                <div style="font-weight:700;margin-bottom:4px;color:#f97316;">MARGIN: ${spacing.margin || '0px'}</div>
                <div style="padding:8px;background:rgba(34,197,94,0.1);border:1px dashed #22c55e;border-radius:4px;">
                  <div style="font-weight:700;margin-bottom:4px;color:#22c55e;">PADDING: ${spacing.padding || '0px'}</div>
                  <div style="padding:6px;background:var(--q-bg-surface-elevated);border:1px solid var(--q-border);border-radius:3px;font-weight:700;color:var(--q-text-primary);">
                    &lt;${d.tag || 'DIV'}&gt; ${d.widthPx || 0}×${d.heightPx || 0}px
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Detailed Spacing</div>
            <div class="prop-grid">
              ${_propRow('Margin (T/R/B/L)', `${spacing.marginTop} ${spacing.marginRight} ${spacing.marginBottom} ${spacing.marginLeft}`)}
              ${_propRow('Padding (T/R/B/L)', `${spacing.paddingTop} ${spacing.paddingRight} ${spacing.paddingBottom} ${spacing.paddingLeft}`)}
              ${_propRow('Gap', spacing.gap || 'normal')}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Layout Architecture</div>
            <div class="prop-grid">
              ${_propRow('Display', layout.display || 'block')}
              ${_propRow('Position', `${layout.position || 'static'} (z: ${layout.zIndex || 'auto'})`)}
              ${_propRow('Overflow', layout.overflow || 'visible')}
              ${_propRow('Visibility', layout.visibility || 'visible')}
              ${_propRow('Box Sizing', layout.boxSizing || 'border-box')}
              ${_propRow('Opacity', layout.opacity || '1')}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Flex / Grid</div>
            <div class="prop-grid">
              ${_propRow('Flex Direction', flexGrid.flexDirection || 'N/A')}
              ${_propRow('Justify Content', flexGrid.justifyContent || 'N/A')}
              ${_propRow('Align Items', flexGrid.alignItems || 'N/A')}
              ${_propRow('Flex Wrap', flexGrid.flexWrap || 'N/A')}
              ${_propRow('Grid Columns', flexGrid.gridTemplateColumns || 'N/A')}
              ${_propRow('Grid Rows', flexGrid.gridTemplateRows || 'N/A')}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Border</div>
            <div class="prop-grid">
              ${_propRow('Border Radius', border.borderRadius || '0px')}
              ${_propRow('Border Width', border.borderWidth || '0px')}
              ${_propRow('Border Style', border.borderStyle || 'none')}
              ${_propRow('Border Color', `<span class="color-swatch" style="background:${hexBorder};"></span> ${hexBorder}`)}
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 6. DOM TREE TAB
      // ══════════════════════════════════════════════
      case 'dom': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🌲 DOM Tree Hierarchy &amp; Selectors</span></div>`;

        // Build a simple visual tree
        const parentStr = dom.parentTag ? `&lt;${dom.parentTag}${dom.parentId ? '#' + dom.parentId : ''}&gt;` : '&lt;html&gt;';
        const childrenStr = dom.childTags && dom.childTags.length
          ? dom.childTags.map(t => `<span style="background:var(--q-bg-primary);border:1px solid var(--q-border);border-radius:4px;padding:1px 5px;font-size:9px;margin:2px;">&lt;${t}&gt;</span>`).join('')
          : '<em style="opacity:0.5;font-size:10px;">No child elements</em>';

        body.innerHTML = `
          <div class="section-label-row">
            <span>DOM HIERARCHY ANALYSIS</span>
            <span class="node-badge">Level ${dom.depth || 1}</span>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">DOM Path</div>
            <div style="font-family:monospace;font-size:10px;color:var(--q-text-secondary);background:var(--q-bg-primary);padding:8px;border-radius:6px;word-break:break-all;line-height:1.8;">
              ${parentStr} &gt; <strong style="color:var(--q-accent);">&lt;${d.tag || 'DIV'}&gt;</strong>
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Node Relationships</div>
            <div class="prop-grid">
              ${_propRow('Parent Element', parentStr)}
              ${_propRow('DOM Depth', `Level ${dom.depth || 1}`)}
              ${_propRow('Child Count', String(dom.childrenCount || 0))}
              ${_propRow('Previous Sibling', dom.previousSiblingTag !== 'None' ? `&lt;${dom.previousSiblingTag}&gt;` : 'None')}
              ${_propRow('Next Sibling', dom.nextSiblingTag !== 'None' ? `&lt;${dom.nextSiblingTag}&gt;` : 'None')}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Child Tags</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">${childrenStr}</div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Selectors</div>
            <div class="prop-grid">
              <div class="prop-row">
                <span class="prop-label">CSS Selector</span>
                <span class="prop-value copy-action-trigger" data-copy-text="${_esc(d.selector || '')}" style="cursor:pointer;" title="Click to copy">
                  ${_esc(d.selector || 'N/A')} 📋
                </span>
              </div>
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 7. CODE TAB
      // ══════════════════════════════════════════════
      case 'code': {
        // Format selector bar — HTML+CSS | React only
        if (this.codeFormat === CODE_FORMATS.HTML_ONLY || !this.codeFormat || this.codeFormat === CODE_FORMATS.HTML_CSS_JS) {
          this.codeFormat = 'html+css-inline';
        }

        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.codeFormat === 'html+css-inline' ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="html+css-inline">HTML+CSS</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.REACT ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.REACT}">React</button>
          </div>
        `;

        let codeText = '';
        if (this.codeScope === 'Full Page') {
          if (this.codeFormat === 'html+css-inline') {
            codeText = this.generateInlineCssHtml(document.body) || '';
          } else {
            codeText = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${document.title}</title>\n${d.pageStyles || ''}\n</head>\n<body>\n${document.body.outerHTML}\n</body>\n</html>`;
          }
        } else {
          if (this.codeFormat === 'html+css-inline') {
            codeText = this.generateInlineCssHtml(this.targetElement) || general.fullOuterHTML || '';
          } else {
            codeText = generateComponentCode(d, this.codeFormat);
          }
        }

        // Live preview of extracted HTML+CSS code
        let previewCardHtml = '';
        if (this.codeFormat === 'html+css-inline' && codeText) {
          const bgIsDark = this.themeManager.isDark();
          const iframeBg = bgIsDark ? '#1a1a1d' : '#ffffff';
          const previewDoc = `<!DOCTYPE html><html><head><meta charset="utf-8">
            <style>
              *, *::before, *::after { box-sizing: border-box; }
              html, body {
                margin: 0;
                padding: 16px;
                background: ${iframeBg};
                display: flex;
                justify-content: center;
                align-items: flex-start;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-height: 100%;
                overflow: auto;
              }
              .preview-inner {
                max-width: 100%;
                display: flex;
                justify-content: center;
              }
            </style>
          </head><body><div class="preview-inner">${codeText}</div></body></html>`;

          previewCardHtml = `
            <div class="qursor-card" style="padding:0;overflow:hidden;margin-top:8px;">
              <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);padding:8px 12px;background:var(--q-bg-surface);border-bottom:1px solid var(--q-border);display:flex;justify-content:space-between;align-items:center;">
                <span>🖼️ Preview: Extracted HTML + CSS</span>
                <span class="node-badge" style="font-size:9px;">Live Component Code</span>
              </div>
              <iframe
                id="codePreviewFrame"
                sandbox="allow-scripts"
                srcdoc="${_escapeAttr(previewDoc)}"
                style="width:100%;height:220px;border:none;background:${iframeBg};display:block;"
              ></iframe>
            </div>
          `;
        }

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label" style="flex-shrink:0;">Scope</span>
              <div class="segment-pill-container" style="width:180px;flex-shrink:0;">
                <button class="segment-btn ${this.codeScope === 'Selected' ? 'active' : ''}" data-seg-group="codeScope" data-seg-value="Selected">Selected Element</button>
                <button class="segment-btn ${this.codeScope === 'Full Page' ? 'active' : ''}" data-seg-group="codeScope" data-seg-value="Full Page">Full Page</button>
              </div>
            </div>
          </div>
          <div class="qursor-card">
            <div class="prop-row" style="font-size:10px;color:var(--q-text-muted);margin-bottom:4px;">
              <span>${d.widthPx || 0}×${d.heightPx || 0}px • ${dom.childrenCount || 0} nodes • ${(this.codeFormat || 'html').toUpperCase()}</span>
              <div style="display:flex;gap:4px;">
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${_esc(codeText)}" title="Copy Code">📋 Copy</button>
                <button class="icon-action-btn download-action-trigger" title="Download">↓ Save</button>
              </div>
            </div>
            <textarea class="q-textarea" style="min-height:160px;" readonly>${_esc(codeText)}</textarea>
          </div>
          ${previewCardHtml}
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 8. EDIT TAB (AI Prompt & Component Transformer)
      // ══════════════════════════════════════════════
      case 'edit': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>✏️ AI Edit &amp; Annotate &lt;${(d.tag || 'div').toLowerCase()}&gt;</span></div>`;

        body.innerHTML = `
          <!-- AI Prompt Box Card -->
          <div class="qursor-card" style="border-left:3px solid #6366f1;">
            <div style="font-weight:700;font-size:12px;color:var(--q-text-primary);margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span>✨ AI Component Prompt</span>
                <span class="node-badge" style="background:rgba(99,102,241,0.15);color:#6366f1;font-size:9px;">LLM Powered</span>
              </div>
              <button class="icon-action-btn" id="editApiKeyQuickBtn" style="font-size:10px;" title="Configure API Key">
                ${this.hasApiKey ? '🔑 API Ready' : '⚠️ Set API Key'}
              </button>
            </div>
            <div style="font-size:11px;color:var(--q-text-muted);margin-bottom:8px;">
              Describe how to transform this &lt;${(d.tag || 'div').toLowerCase()}&gt; component:
            </div>
            <textarea 
              id="aiEditPromptArea" 
              class="q-textarea" 
              style="min-height:75px;resize:vertical;" 
              placeholder="e.g. 'Make this a dark glassmorphic card with rounded corners, subtle border glow, and modern typography...'"
            >${_esc(this.aiEditPromptText || '')}</textarea>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
              <button class="q-btn" id="resetEditBtn" title="Revert to original component before AI edits">
                ↺ Revert
              </button>
              <button 
                class="q-btn q-btn-primary" 
                id="applyAiEditBtn" 
                style="background:linear-gradient(135deg, #6366f1, #8b5cf6);color:#fff;font-weight:600;padding:6px 14px;"
                ${this.isAiGenerating ? 'disabled' : ''}
              >
                ${this.isAiGenerating ? '<span>⏳ Generating...</span>' : '⚡ Apply with AI'}
              </button>
            </div>
          </div>

          <!-- Direct Property Overrides (Manual) -->
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Direct Property Overrides (Manual)</div>
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">color:</span><input type="text" class="edit-prop-input" data-style-prop="color" value="${_esc(hexColor)}" placeholder="${_esc(hexColor)}" /></div>
              <div class="prop-row"><span class="prop-label">background:</span><input type="text" class="edit-prop-input" data-style-prop="backgroundColor" value="${_esc(hexBg)}" placeholder="${_esc(hexBg)}" /></div>
              <div class="prop-row"><span class="prop-label">font-size:</span><input type="text" class="edit-prop-input" data-style-prop="fontSize" value="${typography.fontSize || '16px'}" placeholder="16px" /></div>
              <div class="prop-row"><span class="prop-label">font-weight:</span><input type="text" class="edit-prop-input" data-style-prop="fontWeight" value="${typography.fontWeight || '400'}" placeholder="400" /></div>
              <div class="prop-row"><span class="prop-label">border-radius:</span><input type="text" class="edit-prop-input" data-style-prop="borderRadius" value="${border.borderRadius || '0px'}" placeholder="0px" /></div>
              <div class="prop-row"><span class="prop-label">padding:</span><input type="text" class="edit-prop-input" data-style-prop="padding" value="${spacing.padding || '0px'}" placeholder="0px" /></div>
              <div class="prop-row"><span class="prop-label">width:</span><input type="text" class="edit-prop-input" data-style-prop="width" value="${layout.width || 'auto'}" placeholder="auto" /></div>
              <div class="prop-row"><span class="prop-label">opacity:</span><input type="text" class="edit-prop-input" data-style-prop="opacity" value="${colors.opacity || '1'}" placeholder="1" /></div>
            </div>
          </div>

          <!-- Instructions Card -->
          <div class="qursor-card">
            <div style="font-size:10px;color:var(--q-text-muted);line-height:1.6;">
              <strong style="color:var(--q-text-primary);">How AI Edit Works:</strong><br/>
              • Type any design change in the AI box (e.g. "make dark theme", "add hover effect", "turn into pill button")<br/>
              • Click <strong style="color:#6366f1;">"Apply with AI"</strong> to invoke the LLM model with your API key<br/>
              • The component is updated in the DOM, the <strong>HTML+CSS</strong> code updates, and the <strong>Live Preview</strong> re-renders immediately!
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 9. ASSETS TAB
      // ══════════════════════════════════════════════
      case 'assets': {
        const rawAssets = extractElementAssets(this.targetElement || document.body);
        const filtered = filterAssets(rawAssets, this.assetFilter);

        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.assetFilter === 'All' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="All">All (${rawAssets.length})</button>
            <button class="segment-btn ${this.assetFilter === 'Images' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="Images">Images</button>
            <button class="segment-btn ${this.assetFilter === 'SVG' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="SVG">SVG</button>
            <button class="segment-btn ${this.assetFilter === 'PNG' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="PNG">PNG</button>
            <button class="segment-btn ${this.assetFilter === 'JPG' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="JPG">JPG</button>
          </div>
        `;

        body.innerHTML = `
          <div class="section-label-row">
            <span>DISCOVERED ASSETS (${filtered.length})</span>
            <span class="node-badge">${this.assetFilter}</span>
          </div>
          ${filtered.length === 0
            ? `<div class="qursor-card"><div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-title">No Assets Found</div><div class="empty-state-desc">No "${this.assetFilter}" assets found in this element's subtree.</div></div></div>`
            : `<div class="asset-grid">
                ${filtered.map(asset => `
                  <div class="asset-card-item">
                    <div class="asset-preview-card">
                      <img src="${_esc(asset.url)}" 
                           style="max-height:60px;max-width:100%;object-fit:contain;" 
                           onerror="this.style.display='none';this.nextElementSibling.style.display='block';" 
                           alt="${_esc(asset.name)}" />
                      <div style="display:none;font-size:20px;color:var(--q-text-muted);">🖼️</div>
                    </div>
                    <div style="font-size:10px;font-weight:600;color:var(--q-text-primary);text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(asset.name)}</div>
                    <div style="font-size:9px;color:var(--q-text-muted);">${asset.format} • ${asset.width}</div>
                    <div style="display:flex;gap:4px;margin-top:2px;">
                      <button class="icon-action-btn copy-action-trigger" data-copy-text="${_esc(asset.url)}" title="Copy URL">📋</button>
                      <a href="${_esc(asset.url)}" download="${_esc(asset.name)}" target="_blank" class="icon-action-btn" style="text-decoration:none;" title="Download">↓</a>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 9. SETTINGS TAB (API Key & Preferences)
      // ══════════════════════════════════════════════
      case 'settings': {
        const currentEffectiveTheme = this.themeManager.getEffectiveTheme(this.themeManager.currentTheme);
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>⚙️ Extension Settings</span></div>`;
        body.innerHTML = `
          <!-- LLM API Configuration -->
          <div class="qursor-card" style="border-left:3px solid #6366f1;">
            <div style="font-weight:700;font-size:12px;color:var(--q-text-primary);margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span>🤖 LLM API Configuration</span>
              </div>
              <span class="node-badge" style="font-size:9px;background:${this.hasApiKey ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'};color:${this.hasApiKey ? '#22c55e' : '#ef4444'};">
                ${this.hasApiKey ? '✓ Configured' : 'Key Missing'}
              </span>
            </div>
            <div style="font-size:11px;color:var(--q-text-muted);margin-bottom:10px;line-height:1.4;">
              Configure your API key to power the AI Component Editor in the Edit tab. Keys are stored locally in your browser storage.
            </div>

            <div class="prop-row" style="margin-bottom:8px;">
              <span class="prop-label" style="flex-shrink:0;width:80px;">Provider</span>
              <select id="settingsLlmProvider" style="flex:1;background:var(--q-bg-primary);color:var(--q-text-primary);border:1px solid var(--q-border);border-radius:6px;padding:5px 8px;font-size:11px;outline:none;">
                <option value="gemini" ${this.llmProvider === 'gemini' ? 'selected' : ''}>Google Gemini (Free Tier / Recommended)</option>
                <option value="openai" ${this.llmProvider === 'openai' ? 'selected' : ''}>OpenAI (ChatGPT / GPT-4o)</option>
                <option value="openrouter" ${this.llmProvider === 'openrouter' ? 'selected' : ''}>OpenRouter (All Models)</option>
                <option value="groq" ${this.llmProvider === 'groq' ? 'selected' : ''}>Groq (Llama-3.3)</option>
              </select>
            </div>

            <div class="prop-row" style="margin-bottom:8px;">
              <span class="prop-label" style="flex-shrink:0;width:80px;">API Key</span>
              <div style="display:flex;gap:4px;flex:1;">
                <input 
                  type="password" 
                  id="settingsApiKeyInput" 
                  class="edit-prop-input" 
                  style="flex:1;font-family:monospace;font-size:11px;padding:6px 8px;border:1px solid var(--q-border);border-radius:6px;background:var(--q-bg-surface);"
                  placeholder="Enter API Key (e.g. AIza... or sk-...)" 
                  value="${_esc(this.apiKey || '')}" 
                />
                <button class="icon-action-btn" id="toggleApiKeyVisibilityBtn" title="Show/Hide API Key" style="padding:4px 8px;">👁️</button>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
              <span style="font-size:10px;color:var(--q-text-muted);">
                ${this.hasApiKey ? '🔒 Key saved in local storage' : '⚠️ Required for AI Edit tab'}
              </span>
              <button class="q-btn q-btn-primary" id="saveApiKeyBtn" style="background:#6366f1;color:#fff;font-weight:600;">
                💾 Save Key
              </button>
            </div>
          </div>

          <!-- Appearance -->
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:8px;">Appearance</div>
            <div class="prop-row">
              <span class="prop-label">Current Theme</span>
              <span class="prop-value">${currentEffectiveTheme === THEMES.DARK ? '🌙 Dark' : '☀️ Light'}</span>
            </div>
            <div class="prop-row" style="margin-top:4px;">
              <span class="prop-label">Theme Mode</span>
              <button class="q-btn q-btn-primary" id="settingsThemeToggleBtn">
                Switch to ${currentEffectiveTheme === THEMES.DARK ? '☀️ Light' : '🌙 Dark'} Mode
              </button>
            </div>
          </div>

          <!-- Keyboard Shortcuts -->
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:8px;">Keyboard Shortcuts</div>
            <div class="prop-grid">
              ${_propRow('Toggle Inspect Mode', '<kbd style="background:var(--q-bg-surface-elevated);border:1px solid var(--q-border);border-radius:4px;padding:2px 5px;font-family:monospace;font-size:10px;">Ctrl+Shift+I</kbd>')}
              ${_propRow('Exit Inspect Mode', '<kbd style="background:var(--q-bg-surface-elevated);border:1px solid var(--q-border);border-radius:4px;padding:2px 5px;font-family:monospace;font-size:10px;">Escape</kbd>')}
            </div>
          </div>

          <!-- About -->
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:8px;">About Qursor++</div>
            <div class="prop-grid">
              ${_propRow('Version', 'v1.0.0')}
              ${_propRow('Extension', 'Qursor++ AI Inspector')}
              ${_propRow('Features', 'Live Preview, Code, AI Edit, Assets, Settings')}
            </div>
          </div>
        `;
        break;
      }

      default: {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>Tab: ${this.activeTab}</span></div>`;
        body.innerHTML = `<div class="qursor-card"><div class="empty-state"><div class="empty-state-title">Coming Soon</div></div></div>`;
        break;
      }
    }
  }

  downloadFile(content, filename) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('[Qursor++] Download failed:', e);
    }
  }
}

// ─── Module-level utility functions ───

function _esc(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function _escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

function _propRow(label, value) {
  return `<div class="prop-row"><span class="prop-label">${label}</span><span class="prop-value">${value}</span></div>`;
}

function _rgbToHex(colorStr) {
  if (!colorStr) return '';
  if (colorStr.startsWith('#')) return colorStr.toUpperCase();
  const match = colorStr.match(/\d+/g);
  if (match && match.length >= 3) {
    const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return '';
}

function decodeHTMLEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
