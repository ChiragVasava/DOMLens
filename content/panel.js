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
import { generateStructuredAiPrompt } from '../utils/prompt_generator.js';
import { extractElementAssets, filterAssets } from '../utils/asset_extractor.js';
import { StyleEditor } from '../utils/style_editor.js';

export class InspectorPanel {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.panelContainer = null;
    this.currentData = null;
    this.targetElement = null;
    this.activeTab = 'live';
    this.userZoomScale = null;

    // Code tab state
    this.codeFormat = CODE_FORMATS.HTML_CSS_JS;
    this.codeScope = 'Selected';
    this.codeStyles = 'Computed';

    // Assets tab state
    this.assetFilter = 'All';

    // Edit tab state
    this.styleEditor = new StyleEditor();
    this.editInstructionText = '';

    // Prompt tab state
    this.promptFrameworkTarget = 'React';
    this.editedPromptText = null;

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

    // Initialize theme from storage (async)
    this.themeManager.init().then((theme) => {
      // Update the theme toggle button icon after init
      const btn = this.panelContainer.querySelector('#themeToggleBtn');
      if (btn) btn.textContent = theme === THEMES.DARK ? '🌙' : '☀️';
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

      // Apply Edits button
      if (e.target.closest('#applyEditBtn')) {
        e.stopPropagation();
        this._applyEdits();
        return;
      }

      // Reset Edits button
      if (e.target.closest('#resetEditBtn')) {
        e.stopPropagation();
        this.styleEditor.reset();
        this.editInstructionText = '';
        // Revert element styles
        if (this.targetElement) {
          this.targetElement.removeAttribute('style');
        }
        this.toastManager.show('✓ Style edits reset', 'info');
        this.renderTabContent();
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
        const content = generateComponentCode(this.currentData, this.codeFormat);
        const ext = this.codeFormat === CODE_FORMATS.REACT ? 'jsx'
          : this.codeFormat === CODE_FORMATS.VUE ? 'vue'
          : this.codeFormat === CODE_FORMATS.CSS_ONLY ? 'css'
          : this.codeFormat === CODE_FORMATS.JS_ONLY ? 'js'
          : 'html';
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

    // ─── Select change handler (prompt framework) ───
    this.panelContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('prompt-target-select')) {
        e.stopPropagation();
        this.promptFrameworkTarget = e.target.value;
        this.editedPromptText = null;
        this.renderTabContent();
      }
    });
  }

  // ─── Internal helpers ───

  _doToggleTheme(headerBtn) {
    const newTheme = this.themeManager.toggleTheme();
    // Update button icon in header
    const allThemeBtns = this.panelContainer.querySelectorAll('#themeToggleBtn');
    allThemeBtns.forEach(btn => {
      btn.textContent = newTheme === THEMES.DARK ? '🌙' : '☀️';
    });
    // Re-render tab content so all inline color values reflect the new theme
    this.renderTabContent();
    this.toastManager.show(`${newTheme === THEMES.DARK ? '🌙' : '☀️'} Switched to ${newTheme.toUpperCase()} mode`, 'info');
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
    if (!data) return;
    this.show();
    this.renderTabContent();
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

        let renderableHtml = general.fullOuterHTML || '';
        const lowerTag = (general.tagName || '').toLowerCase();
        if (lowerTag === 'td' || lowerTag === 'th') {
          renderableHtml = `<table style="border-collapse:collapse;"><tbody><tr>${renderableHtml}</tr></tbody></table>`;
        } else if (lowerTag === 'tr') {
          renderableHtml = `<table style="border-collapse:collapse;"><tbody>${renderableHtml}</tbody></table>`;
        } else if (lowerTag === 'li') {
          renderableHtml = `<ul style="margin:0; padding:0 0 0 20px; list-style:disc;">${renderableHtml}</ul>`;
        }

        const iframeSrc = `<!DOCTYPE html><html><head><meta charset="utf-8">${d.pageStyles || ''}
          <style>
            html,body{margin:0;padding:12px;background:transparent;overflow:auto;display:flex;justify-content:center;}
            .preview-wrap{width:${targetWidth}px;transform:scale(${activeZoom});transform-origin:top center;}
          </style></head><body><div class="preview-wrap">${renderableHtml}</div></body></html>`;

        body.innerHTML = `
          <div class="section-label-row">
            <span>COMPONENT LIVE FRAME</span>
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
              <div class="prop-row">
                <span class="prop-label">XPath</span>
                <span class="prop-value copy-action-trigger" data-copy-text="${_esc(d.xpath || '')}" style="cursor:pointer;" title="Click to copy">
                  ${_esc((d.xpath || 'N/A').substring(0, 50))}${(d.xpath || '').length > 50 ? '…' : ''} 📋
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
        // Format selector bar in trigger bar — HTML | HTML+CSS | React
        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.HTML_ONLY ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.HTML_ONLY}">HTML</button>
            <button class="segment-btn ${this.codeFormat === 'html+css-inline' ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="html+css-inline">HTML+CSS</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.REACT ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.REACT}">React</button>
          </div>
        `;

        // Generate HTML with every element's computed styles as inline style="..."
        const generateInlineCssHtml = (el) => {
          if (!el || el.nodeType !== 1) return el ? el.outerHTML || '' : '';
          try {
            const clone = el.cloneNode(true);
            const allEls = [el, ...el.querySelectorAll('*')];
            const cloneEls = [clone, ...clone.querySelectorAll('*')];
            allEls.forEach((orig, i) => {
              const cs = window.getComputedStyle(orig);
              // Only extract non-default/non-inherited properties that matter visually
              const PROPS = [
                'color','background-color','font-size','font-weight','font-family',
                'line-height','letter-spacing','text-align','text-decoration','text-transform',
                'padding','padding-top','padding-right','padding-bottom','padding-left',
                'margin','margin-top','margin-right','margin-bottom','margin-left',
                'border','border-radius','box-shadow','opacity','display','flex-direction',
                'align-items','justify-content','gap','width','height','max-width',
                'position','top','left','right','bottom','z-index','overflow',
                'cursor','pointer-events','visibility'
              ];
              const styleStr = PROPS.map(p => {
                const v = cs.getPropertyValue(p);
                return v && v !== '' && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== 'static' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)' ? `${p}:${v}` : null;
              }).filter(Boolean).join(';');
              if (cloneEls[i]) cloneEls[i].setAttribute('style', styleStr);
            });
            return clone.outerHTML;
          } catch(e) {
            return el.outerHTML;
          }
        };

        let codeText = '';
        if (this.codeScope === 'Full Page') {
          if (this.codeFormat === 'html+css-inline') {
            codeText = generateInlineCssHtml(document.documentElement) || '';
          } else {
            codeText = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${document.title}</title>\n${d.pageStyles || ''}\n</head>\n<body>\n${document.body.outerHTML}\n</body>\n</html>`;
          }
        } else {
          if (this.codeFormat === 'html+css-inline') {
            codeText = generateInlineCssHtml(this.targetElement);
          } else {
            codeText = generateComponentCode(d, this.codeFormat);
          }
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
            <textarea class="q-textarea" style="min-height:180px;" readonly>${_esc(codeText)}</textarea>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 8. EDIT TAB
      // ══════════════════════════════════════════════
      case 'edit': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>✏️ Edit &amp; Annotate &lt;${(d.tag || 'div').toLowerCase()}&gt;</span></div>`;

        body.innerHTML = `
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Direct Property Overrides</div>
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
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:4px;">Natural Language Instruction</div>
            <div style="font-size:10px;color:var(--q-text-muted);margin-bottom:6px;">
              e.g. "make background blue", "change text to Hello World", "set font size 24px", "make it bold"
            </div>
            <textarea id="editInstructionArea" class="q-textarea" style="min-height:60px;" placeholder="Type an instruction to modify this element...">${_esc(this.editInstructionText)}</textarea>
            <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:4px;">
              <button class="q-btn" id="resetEditBtn">↺ Reset</button>
              <button class="q-btn q-btn-primary" id="applyEditBtn">✓ Apply &amp; Preview</button>
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-size:10px;color:var(--q-text-muted);line-height:1.6;">
              <strong style="color:var(--q-text-primary);">How it works:</strong><br/>
              • Direct property inputs update the element immediately as you type<br/>
              • Natural language instruction parses text like "make background red", "change font size to 20px"<br/>
              • Click <strong>"Apply &amp; Preview"</strong> to commit all changes and see them in the Live tab
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
      // 10. PROMPT TAB
      // ══════════════════════════════════════════════
      case 'prompt': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>👤 AI Prompt Builder</span></div>`;
        const promptContent = this.editedPromptText || generateStructuredAiPrompt(d, this.promptFrameworkTarget);

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Target Framework</span>
              <select class="prompt-target-select" style="background:var(--q-bg-primary);color:var(--q-text-primary);border:1px solid var(--q-border);border-radius:6px;padding:4px 8px;font-size:10px;outline:none;">
                <option value="React" ${this.promptFrameworkTarget === 'React' ? 'selected' : ''}>React</option>
                <option value="Next.js" ${this.promptFrameworkTarget === 'Next.js' ? 'selected' : ''}>Next.js</option>
                <option value="Vue 3" ${this.promptFrameworkTarget === 'Vue 3' ? 'selected' : ''}>Vue 3</option>
                <option value="Angular" ${this.promptFrameworkTarget === 'Angular' ? 'selected' : ''}>Angular</option>
                <option value="Tailwind CSS" ${this.promptFrameworkTarget === 'Tailwind CSS' ? 'selected' : ''}>Tailwind CSS</option>
                <option value="Vanilla HTML/CSS/JS" ${this.promptFrameworkTarget === 'Vanilla HTML/CSS/JS' ? 'selected' : ''}>Vanilla</option>
              </select>
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:4px;">Generated AI Prompt</div>
            <textarea class="q-textarea" style="min-height:200px;">${_esc(promptContent)}</textarea>
            <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:4px;">
              <button class="q-btn copy-action-trigger" data-copy-text="${_esc(promptContent)}">📋 Copy AI Prompt</button>
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 11. SETTINGS TAB
      // ══════════════════════════════════════════════
      case 'settings': {
        const currentEffectiveTheme = this.themeManager.getEffectiveTheme(this.themeManager.currentTheme);
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>⚙️ Extension Settings</span></div>`;
        body.innerHTML = `
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
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:8px;">Keyboard Shortcuts</div>
            <div class="prop-grid">
              ${_propRow('Toggle Inspect Mode', '<kbd style="background:var(--q-bg-surface-elevated);border:1px solid var(--q-border);border-radius:4px;padding:2px 5px;font-family:monospace;font-size:10px;">Ctrl+Shift+I</kbd>')}
              ${_propRow('Exit Inspect Mode', '<kbd style="background:var(--q-bg-surface-elevated);border:1px solid var(--q-border);border-radius:4px;padding:2px 5px;font-family:monospace;font-size:10px;">Escape</kbd>')}
            </div>
          </div>
          <div class="qursor-card">
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:8px;">About Qursor++</div>
            <div class="prop-grid">
              ${_propRow('Version', 'v1.0.0')}
              ${_propRow('Extension', 'Qursor++ AI Inspector')}
              ${_propRow('Features', 'Live Preview, DOM, Code, Edit, Assets, AI Prompt')}
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
  return str.replace(/"/g, '&quot;');
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
