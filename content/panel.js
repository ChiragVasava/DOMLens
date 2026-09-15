/**
 * Qursor++ - Floating Information Panel UI
 * 
 * 9 Navigation Tabs:
 * 1. Live (Live component preview with zoom and canvas theme isolation)
 * 2. Overview (Telemetry, metrics, tag, classes, color chips)
 * 3. Typography (Live specimen render & metrics)
 * 4. Colors (Swatches, text, background, border, shadow)
 * 5. Layout (Box model diagram, spacing, flex/grid)
 * 6. Code (HTML, CSS, JavaScript, React with Tailwind)
 * 7. Edit (Natural language LLM instruction editing)
 * 8. Assets (Media scanner with format filters)
 * 9. Settings (Theme preference, AI API configuration)
 */

import { QURSOR_NAV_TABS } from '../utils/constants.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { DESIGN_TOKENS, ThemeManager, THEMES } from '../utils/theme.js';
import { ToastManager } from '../utils/toast.js';
import { generateComponentCode, CODE_FORMATS } from '../utils/component_generator.js';
import { extractElementAssets, filterAssets } from '../utils/asset_extractor.js';
import { ComponentState } from '../utils/component_state.js';
import { buildLivePreviewDoc } from '../utils/preview_renderer.js';
import { detectSimpleTextEdit } from '../utils/text_editor.js';
import {
  callLlmEditComponent,
  callLlmGenerateReact,
  getLlmConfig,
  saveLlmConfig,
  clearLlmConfig,
  maskApiKey,
  LLM_PROVIDERS,
  DEFAULT_MODELS,
  DEFAULT_GEMINI_MODEL
} from '../utils/llm_service.js';

export class InspectorPanel {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.panelContainer = null;
    this.targetElement = null;

    // Authoritative Central State Model
    this.state = new ComponentState();

    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.onClose = null;

    // Cached AI-generated React component to avoid regenerating repeatedly unless requested
    this.cachedAiReact = null;
    this.isGeneratingAiReact = false;

    // AI Settings Cache for UI display
    this.llmConfig = {
      apiKey: '',
      provider: LLM_PROVIDERS.GEMINI,
      model: DEFAULT_MODELS[LLM_PROVIDERS.GEMINI],
      isConfigured: false
    };

    this.themeManager = new ThemeManager(shadowRoot);
    this.toastManager = new ToastManager(shadowRoot);

    this.createPanelDOM();

    // Subscribe to state changes to ensure UI always stays synchronized
    this.state.subscribe((state, eventType) => {
      if (eventType === 'current_updated' || eventType === 'reset') {
        this.cachedAiReact = null; // invalidate cached React component on edit/reset
      }
    });
  }

  createPanelDOM() {
    const style = document.createElement('style');
    style.textContent = `
      ${DESIGN_TOKENS}

      * { box-sizing: border-box; }

      .qursor-floating-panel {
        position: fixed;
        bottom: 20px;
        right: 24px;
        width: 440px;
        max-width: calc(100vw - 36px);
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
        min-height: 320px;
        max-height: calc(100vh - 36px);
        backdrop-filter: blur(20px);
        transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
      }

      /* Navigation Header */
      .qursor-icon-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--q-bg-surface, #242426);
        border-bottom: 1px solid var(--q-border-subtle);
        cursor: grab;
        user-select: none;
        flex-shrink: 0;
        min-height: 42px;
      }
      .qursor-icon-navbar:active {
        cursor: grabbing;
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
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        transition: all 0.15s;
      }
      .nav-action-btn:hover {
        background: var(--q-bg-hover);
        color: var(--q-text-primary);
      }

      /* Trigger / Status sub-bar */
      .qursor-trigger-bar {
        padding: 8px 12px;
        background: var(--q-bg-surface);
        border-bottom: 1px solid var(--q-border-subtle);
        flex-shrink: 0;
      }

      .trigger-input-pill {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--q-bg-primary);
        border: 1px solid var(--q-border);
        border-radius: 8px;
        padding: 5px 10px;
        font-size: 11px;
        color: var(--q-text-muted);
      }

      .zoom-controls-group {
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .zoom-btn {
        background: var(--q-bg-surface-elevated);
        border: 1px solid var(--q-border);
        color: var(--q-text-primary);
        width: 24px;
        height: 22px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        transition: all 0.15s;
      }
      .zoom-btn:hover { background: var(--q-bg-hover); border-color: var(--q-accent); }

      /* Segment Pills */
      .segment-pill-container {
        display: flex;
        background: var(--q-bg-primary);
        border: 1px solid var(--q-border);
        border-radius: 8px;
        padding: 2px;
        gap: 2px;
      }

      .segment-btn {
        flex: 1;
        background: none;
        border: none;
        color: var(--q-text-muted);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
        transition: all 0.15s;
        white-space: nowrap;
      }

      .segment-btn:hover { color: var(--q-text-primary); }

      .segment-btn.active {
        background: var(--q-bg-surface);
        color: var(--q-text-primary);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      /* Scrollable Panel Body */
      .qursor-panel-body {
        padding: 12px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .qursor-panel-body::-webkit-scrollbar { width: 5px; }
      .qursor-panel-body::-webkit-scrollbar-thumb {
        background: var(--q-border);
        border-radius: 4px;
      }

      /* Sections & Cards */
      .section-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
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

      /* Property Grid */
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

      /* Buttons & Controls */
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
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--q-border);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        background: var(--q-bg-surface-elevated);
        color: var(--q-text-primary);
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
      .q-btn:hover { background: var(--q-bg-hover); border-color: var(--q-accent); }
      .q-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .q-btn-primary {
        background: var(--q-accent, #2563eb) !important;
        color: #ffffff !important;
        border-color: var(--q-accent, #2563eb) !important;
      }
      .q-btn-primary:hover { background: var(--q-accent-hover, #1d4ed8) !important; }

      .q-btn-danger {
        background: rgba(255, 59, 48, 0.12) !important;
        color: #ff3b30 !important;
        border-color: rgba(255, 59, 48, 0.3) !important;
      }
      .q-btn-danger:hover { background: rgba(255, 59, 48, 0.22) !important; }

      .q-input {
        width: 100%;
        background: var(--q-bg-primary);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        outline: none;
        transition: border-color 0.15s;
      }
      .q-input:focus { border-color: var(--q-accent); }

      .q-select {
        background: var(--q-bg-primary);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 11px;
        outline: none;
      }

      .q-textarea {
        width: 100%;
        background: var(--q-bg-primary);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 6px;
        padding: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        line-height: 1.5;
        outline: none;
        resize: vertical;
        transition: border-color 0.15s;
      }
      .q-textarea:focus { border-color: var(--q-accent); }

      .color-swatch {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        border: 1px solid rgba(128,128,128,0.3);
        display: inline-block;
        vertical-align: middle;
        flex-shrink: 0;
      }

      .status-pill-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
      }
      .status-pill-badge.configured {
        background: rgba(52, 199, 89, 0.15);
        color: #34c759;
        border: 1px solid rgba(52, 199, 89, 0.3);
      }
      .status-pill-badge.not-configured {
        background: rgba(142, 142, 147, 0.15);
        color: var(--q-text-muted);
        border: 1px solid var(--q-border);
      }

      .alert-box {
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 11px;
        line-height: 1.4;
      }
      .alert-box.error {
        background: rgba(255, 59, 48, 0.12);
        color: #ff453a;
        border: 1px solid rgba(255, 59, 48, 0.3);
      }
      .alert-box.success {
        background: rgba(52, 199, 89, 0.12);
        color: #34c759;
        border: 1px solid rgba(52, 199, 89, 0.3);
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
            <button class="nav-icon-btn ${tab.id === this.state.activeTab ? 'active' : ''}" data-tab="${tab.id}" title="${tab.label}">
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
          <div class="empty-state-desc">Click any element on the page to inspect live preview, overview, code, edits, or assets.</div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(this.panelContainer);

    // Initialize Theme & LLM Config
    this.themeManager.init().then((theme) => {
      chrome.storage.sync.get(['qursor_theme_preference'], (res) => {
        let resolvedTheme = theme;
        if (!res['qursor_theme_preference']) {
          const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
          resolvedTheme = prefersLight ? THEMES.LIGHT : THEMES.DARK;
          this.themeManager.setTheme(resolvedTheme, true);
        }
        this.state.setTheme(resolvedTheme);
        const btn = this.panelContainer.querySelector('#themeToggleBtn');
        if (btn) btn.textContent = resolvedTheme === THEMES.DARK ? '☀️' : '🌙';
      });
    });

    getLlmConfig().then(cfg => {
      this.llmConfig = cfg;
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    const header = this.panelContainer.querySelector('#panelHeader');
    const closeBtn = this.panelContainer.querySelector('#panelCloseBtn');
    const themeToggleBtn = this.panelContainer.querySelector('#themeToggleBtn');
    const navGroup = this.panelContainer.querySelector('#navIconsGroup');

    // ─── Host Site Event Propagation Shield ───
    // Prevents host page shortcuts from hijacking inputs inside the inspector panel
    ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress', 'input', 'change'].forEach(evtType => {
      this.panelContainer.addEventListener(evtType, (e) => {
        e.stopPropagation();
      });
    });

    // ─── Dragging Logic (Pointer Capture & Iframe Shielding) ───
    const setIframesShield = (shield) => {
      this.panelContainer.querySelectorAll('iframe').forEach(frame => {
        frame.style.pointerEvents = shield ? 'none' : '';
      });
    };

    const onDragStart = (e) => {
      // Ignore clicks on buttons, inputs, links, or nav icons
      if (e.target.closest('button, input, textarea, select, a, .nav-icon-btn, .nav-action-btn, .zoom-btn')) {
        return;
      }
      e.preventDefault();
      this.isDragging = true;
      this.panelContainer.style.userSelect = 'none';
      this.panelContainer.style.cursor = 'grabbing';
      header.style.cursor = 'grabbing';

      // Shield iframe so mouse events are never swallowed by iframe preview document
      setIframesShield(true);

      if (header.setPointerCapture && e.pointerId !== undefined) {
        try {
          header.setPointerCapture(e.pointerId);
          this._activePointerId = e.pointerId;
        } catch (err) { }
      }

      const rect = this.panelContainer.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;

      this.panelContainer.style.top = `${rect.top}px`;
      this.panelContainer.style.left = `${rect.left}px`;
      this.panelContainer.style.bottom = 'auto';
      this.panelContainer.style.right = 'auto';
    };

    header.addEventListener('pointerdown', onDragStart);
    header.addEventListener('mousedown', onDragStart);

    const onDragMove = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const panelW = this.panelContainer.offsetWidth;
      const panelH = this.panelContainer.offsetHeight;
      const maxLeft = Math.max(0, window.innerWidth - panelW);
      const maxTop = Math.max(0, window.innerHeight - panelH);
      const left = Math.max(0, Math.min(maxLeft, e.clientX - this.dragOffsetX));
      const top = Math.max(0, Math.min(maxTop, e.clientY - this.dragOffsetY));
      this.panelContainer.style.left = `${left}px`;
      this.panelContainer.style.top = `${top}px`;
    };

    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('mousemove', onDragMove);

    const stopDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.panelContainer.style.userSelect = '';
      this.panelContainer.style.cursor = '';
      header.style.cursor = 'grab';

      // Restore iframe pointer interactions
      setIframesShield(false);

      if (header.releasePointerCapture && this._activePointerId !== undefined) {
        try {
          header.releasePointerCapture(this._activePointerId);
        } catch (err) { }
        this._activePointerId = undefined;
      }
    };

    // Safety mechanisms: release dragging on pointerup, mouseup, pointercancel, blur, or window leave
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('blur', stopDrag);
    document.addEventListener('mouseleave', stopDrag);

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
      this.state.setActiveTab(tabId);
      this._updateNavHighlight();
      this.renderTabContent();
    });

    // ─── Delegated Actions for Buttons in Panel Body / Trigger Bar ───
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
        if (segGroup === 'codeFormat') this.state.setCodeFormat(value);
        if (segGroup === 'codeScope') this.state.setCodeScope(value);
        if (segGroup === 'assetFilter') this.state.setAssetFilter(value);
        this.renderTabContent();
        return;
      }

      // Zoom Controls (Live Preview)
      if (zoomBtn && this.state.hasElement()) {
        e.stopPropagation();
        const action = zoomBtn.dataset.zoomAction;
        const d = this.state.original.elementData;
        const targetWidth = (this.state.preview.width && this.state.preview.width > 20) ? this.state.preview.width : ((d.widthPx && d.widthPx > 20) ? d.widthPx : 400);
        const targetHeight = (this.state.preview.height && this.state.preview.height > 20) ? this.state.preview.height : ((d.heightPx && d.heightPx > 20) ? d.heightPx : 300);
        const autoScale = parseFloat(Math.min(390 / targetWidth, 260 / targetHeight, 1.0).toFixed(3));
        let currentZoom = (this.state.zoom !== null) ? this.state.zoom : autoScale;

        if (action === 'in') this.state.setZoom(parseFloat(Math.min(3.0, currentZoom + 0.15).toFixed(2)));
        else if (action === 'out') this.state.setZoom(parseFloat(Math.max(0.1, currentZoom - 0.15).toFixed(2)));
        else if (action === 'fit') this.state.setZoom(autoScale);
        else if (action === 'reset') this.state.setZoom(1.0);

        this.renderTabContent();
        return;
      }

      // Apply Edits with LLM
      if (e.target.closest('#applyEditBtn')) {
        e.stopPropagation();
        await this._handleApplyEdit();
        return;
      }

      // Reset Edits to original captured component
      if (e.target.closest('#resetEditBtn')) {
        e.stopPropagation();
        this._handleResetEdit();
        return;
      }

      // Re-generate React with AI
      if (e.target.closest('#generateAiReactBtn')) {
        e.stopPropagation();
        await this._handleGenerateAiReact();
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

      // Settings: Save API Key
      if (e.target.closest('#saveApiKeyBtn')) {
        e.stopPropagation();
        await this._handleSaveApiKey();
        return;
      }

      // Settings: Clear API Key
      if (e.target.closest('#clearApiKeyBtn')) {
        e.stopPropagation();
        await this._handleClearApiKey();
        return;
      }

      // Copy Action Trigger
      if (copyBtn) {
        e.stopPropagation();
        const text = copyBtn.dataset.copyText;
        if (text) {
          await copyToClipboard(decodeHTMLEntities(text));
          this.toastManager.show('✓ Copied to clipboard!', 'success');
        }
        return;
      }

      // Download Action Trigger
      if (downloadBtn && this.state.hasElement()) {
        e.stopPropagation();
        const format = this.state.codeFormat;
        let content = '';
        let ext = 'html';

        if (format === CODE_FORMATS.REACT) {
          content = this.cachedAiReact || generateComponentCode(this.state.original.elementData, CODE_FORMATS.REACT, this.state.current.html, this.state.current.css);
          ext = 'jsx';
        } else {
          const css = (this.state.current.css || this.state.original.css || '').trim();
          content = css
            ? `${this.state.current.html}\n\n<style>\n${css}\n</style>`
            : this.state.current.html;
          ext = 'html';
        }

        const tag = (this.state.original.elementData.tag || 'component').toLowerCase();
        this.downloadFile(content, `qursor_${tag}.${ext}`);
        this.toastManager.show(`✓ Downloaded ${ext.toUpperCase()} file`, 'success');
        return;
      }
    });
  }

  // ─── Theme Management ───

  _doToggleTheme(headerBtn) {
    const newTheme = this.themeManager.toggleTheme();
    this.state.setTheme(newTheme);
    const icon = newTheme === THEMES.DARK ? '☀️' : '🌙';
    this.panelContainer.querySelectorAll('#themeToggleBtn').forEach(btn => {
      btn.textContent = icon;
    });
    this.renderTabContent();
    this.toastManager.show(`Switched to ${newTheme === THEMES.DARK ? 'Dark 🌑' : 'Light ☀️'} mode`, 'info');
  }

  _updateNavHighlight() {
    const navGroup = this.panelContainer.querySelector('#navIconsGroup');
    if (navGroup) {
      navGroup.querySelectorAll('.nav-icon-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === this.state.activeTab);
      });
    }
  }

  // ─── LLM Edit Workflow (Section 7, 8, 11, 12, 13) ───

  async _handleApplyEdit() {
    const textarea = this.panelContainer.querySelector('#editInstructionArea');
    const instruction = textarea ? textarea.value.trim() : '';

    if (!instruction) {
      this.toastManager.show('Please enter an instruction (e.g. "make background blue")', 'warning');
      return;
    }

    // Fast-path: Deterministic text edit check (Section 19 compliance)
    // Avoids unnecessary API latency, eliminates 503 errors, and guarantees 100% CSS preservation
    const simpleEdit = detectSimpleTextEdit(instruction, this.state.current.html);
    if (simpleEdit) {
      this.state.updateCurrent(simpleEdit.html, this.state.current.css, simpleEdit.changes);
      this.toastManager.show('✓ Text updated instantly!', 'success');
      this.renderTabContent();
      return;
    }

    const applyBtn = this.panelContainer.querySelector('#applyEditBtn');
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.innerHTML = '⚡ Applying with AI...';
    }

    this.state.setEditState({ instruction, isApplying: true, error: null });

    try {
      const effectiveTheme = this.themeManager.getEffectiveTheme(this.state.theme);
      const result = await callLlmEditComponent({
        instruction,
        currentHtml: this.state.current.html,
        currentCss: this.state.current.css,
        elementData: this.state.original.elementData,
        theme: effectiveTheme
      });

      // Update central component state
      this.state.updateCurrent(result.html, result.css, result.changes);
      this.toastManager.show('✓ Component updated with AI!', 'success');

      // Re-render
      this.renderTabContent();
    } catch (err) {
      console.error('[Qursor++ Edit Error]:', err);
      // NEVER corrupt the existing component on failure
      this.state.setEditState({ isApplying: false, error: err.message });
      const toastMsg = err.message.includes('temporarily unavailable') ? err.message : `LLM failed: ${err.message}`;
      this.toastManager.show(toastMsg, 'error');
      this.renderTabContent();
    }
  }

  _handleResetEdit() {
    this.state.resetToOriginal();
    this.toastManager.show('✓ Reset component to original state', 'info');
    this.renderTabContent();
  }

  // ─── AI React Generation Workflow ───

  async _handleGenerateAiReact() {
    if (this.isGeneratingAiReact) return;
    this.isGeneratingAiReact = true;
    this.renderTabContent();

    try {
      const code = await callLlmGenerateReact({
        html: this.state.current.html,
        css: this.state.current.css,
        elementData: this.state.original.elementData,
        assets: this.state.original.assets
      });

      this.cachedAiReact = code;
      this.toastManager.show('✓ React component generated with AI & Tailwind!', 'success');
    } catch (err) {
      console.error('[Qursor++ React Gen Error]:', err);
      this.toastManager.show(`React AI generation failed: ${err.message}`, 'error');
    } finally {
      this.isGeneratingAiReact = false;
      this.renderTabContent();
    }
  }

  // ─── Settings AI Key Handlers ───

  async _handleSaveApiKey() {
    const keyInput = this.panelContainer.querySelector('#settingsApiKeyInput');
    const providerSelect = this.panelContainer.querySelector('#settingsProviderSelect');
    const modelInput = this.panelContainer.querySelector('#settingsModelInput');

    const key = keyInput ? keyInput.value.trim() : '';
    const provider = providerSelect ? providerSelect.value : null;
    const model = modelInput ? modelInput.value.trim() : null;

    if (!key) {
      this.toastManager.show('Please enter a valid API key', 'warning');
      return;
    }

    const saved = await saveLlmConfig(key, provider, model);
    this.llmConfig = saved;
    this.toastManager.show('✓ API key and configuration saved!', 'success');
    this.renderTabContent();
  }

  async _handleClearApiKey() {
    if (!confirm('Are you sure you want to clear the configured API key?')) return;
    await clearLlmConfig();
    this.llmConfig = { apiKey: '', provider: LLM_PROVIDERS.GEMINI, model: DEFAULT_MODELS[LLM_PROVIDERS.GEMINI], isConfigured: false };
    this.toastManager.show('API key cleared', 'info');
    this.renderTabContent();
  }

  // ─── Public API ───

  updateData(data, element = null) {
    this.targetElement = element;
    if (!data) return;

    const html = data.componentHtml || data.general?.fullOuterHTML || element?.outerHTML || '';
    const css = data.componentCss || data.rawCss || '';
    const assets = extractElementAssets(element || document.body);

    this.state.setElement(element, data, html, css, assets);
    this.state.setTheme(this.themeManager.currentTheme);
    this.cachedAiReact = null;

    this.show();
    this.renderTabContent();
  }

  show() {
    if (!this.panelContainer) return;
    this.panelContainer.style.display = 'flex';
    if (!this.panelContainer.style.height || this.panelContainer.style.height === '') {
      const h = Math.min(window.innerHeight - 40, 680);
      this.panelContainer.style.height = `${h}px`;
    }
  }

  hide() {
    if (this.panelContainer) this.panelContainer.style.display = 'none';
  }

  // ─── Unified Tab Content Renderer ───

  renderTabContent() {
    const triggerBar = this.panelContainer.querySelector('#triggerBar');
    const body = this.panelContainer.querySelector('#panelBody');
    if (!body || !triggerBar) return;

    if (!this.state.hasElement()) {
      triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🔍 Click any element on webpage to inspect</span></div>`;
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-title">No Element Selected</div>
          <div class="empty-state-desc">Click any element on the page to inspect live preview, overview, code, edits, or assets.</div>
        </div>`;
      return;
    }

    const d = this.state.original.elementData;
    const general = d.general || { tagName: 'DIV', id: 'N/A', classList: [], textContent: '' };
    const typography = d.typography || { fontFamily: 'system-ui', fontSize: '16px', fontWeight: '400', lineHeight: 'normal', letterSpacing: 'normal' };
    const colors = d.colors || { color: '#000000', backgroundColor: '#ffffff', hexColor: '#000000', hexBgColor: '#ffffff', hexBorderColor: '#cccccc' };
    const spacing = d.spacing || { margin: '0px', padding: '0px', gap: 'normal', marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px', paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px' };
    const layout = d.layout || { display: 'block', position: 'static', zIndex: 'auto', boxSizing: 'border-box', overflow: 'visible' };
    const border = d.border || { borderRadius: '0px', borderWidth: '0px', borderStyle: 'none', borderColor: 'transparent' };
    const flexGrid = d.flexGrid || { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-start', flexWrap: 'nowrap', gap: '0px' };
    const classes = d.classes || [];

    const hexColor = colors.hexColor || _rgbToHex(colors.color) || '#000000';
    const hexBg = colors.hexBgColor || _rgbToHex(colors.backgroundColor) || '#FFFFFF';
    const hexBorder = colors.hexBorderColor || _rgbToHex(colors.borderColor || border.borderColor) || '#CCCCCC';

    const effectiveTheme = this.themeManager.getEffectiveTheme(this.state.theme);

    switch (this.state.activeTab) {
      // ══════════════════════════════════════════════
      // 1. LIVE TAB (Isolated HTML + CSS Preview)
      // ══════════════════════════════════════════════
      case 'live': {
        const targetWidth = (this.state.preview.width && this.state.preview.width > 20) ? this.state.preview.width : ((d.widthPx && d.widthPx > 20) ? d.widthPx : 400);
        const targetHeight = (this.state.preview.height && this.state.preview.height > 20) ? this.state.preview.height : ((d.heightPx && d.heightPx > 20) ? d.heightPx : 300);
        const autoScale = parseFloat(Math.min(390 / targetWidth, 260 / targetHeight, 1.0).toFixed(3));
        const activeZoom = (this.state.zoom !== null) ? this.state.zoom : autoScale;
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

        // Render preview with authoritative current HTML + current CSS and Canvas Theme Isolation
        const compBg = this.state.original.elementData?.effectiveBg || (this.state.original.elementData?.colorScheme === 'dark' ? '#0d1117' : '#ffffff');
        const compFg = this.state.original.elementData?.effectiveColor || (this.state.original.elementData?.colorScheme === 'dark' ? '#e6edf3' : '#1f2328');
        const compScheme = this.state.original.elementData?.colorScheme || 'dark';

        const previewHtml = buildLivePreviewDoc(
          this.state.current.html,
          this.state.current.css,
          {
            effectiveBg: compBg,
            effectiveColor: compFg,
            colorScheme: compScheme,
            effectiveFontFamily: this.state.original.elementData?.effectiveFontFamily,
            pageStyles: this.state.original.elementData?.pageStyles,
            zoom: activeZoom,
            width: targetWidth,
            height: targetHeight
          }
        );

        body.innerHTML = `
          <div class="section-label-row">
            <span>COMPONENT LIVE FRAME</span>
            <span class="node-badge">${targetWidth}×${targetHeight}px • Source: ${compScheme.toUpperCase()}</span>
          </div>
          <div class="qursor-card" style="padding:4px;background:${compBg};border:1px solid var(--q-border);flex:1;min-height:280px;display:flex;">
            <iframe id="livePreviewFrame" style="width:100%;flex:1;min-height:280px;border:none;border-radius:8px;background:${compBg};" srcdoc="${_escapeAttr(previewHtml)}"></iframe>
          </div>
          ${this.state.current.changes.length > 0 ? `
            <div class="alert-box success">
              <strong>Modified with AI:</strong>
              <ul style="margin:4px 0 0 16px;padding:0;">
                ${this.state.current.changes.map(c => `<li>${_esc(c)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
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
              ${_propRow('CSS Selector', `<span class="copy-action-trigger" data-copy-text="${_esc(d.selector || '')}" style="cursor:pointer;" title="Copy">${_esc(d.selector || 'N/A')} 📋</span>`)}
              ${_propRow('ARIA Role', _esc(general.role || 'N/A'))}
              ${_propRow('Accessible Name', _esc(general.accessibleName || 'N/A'))}
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
              ${_propRow('Text Align', typography.textAlign || 'left')}
              ${_propRow('Text Transform', typography.textTransform || 'none')}
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
            <div style="font-weight:700;font-size:11px;color:var(--q-text-primary);margin-bottom:6px;">Layout Properties</div>
            <div class="prop-grid">
              ${_propRow('Display', layout.display || 'block')}
              ${_propRow('Position', `${layout.position || 'static'} (z: ${layout.zIndex || 'auto'})`)}
              ${_propRow('Flex Direction', flexGrid.flexDirection || 'N/A')}
              ${_propRow('Justify Content', flexGrid.justifyContent || 'N/A')}
              ${_propRow('Align Items', flexGrid.alignItems || 'N/A')}
              ${_propRow('Border Radius', border.borderRadius || '0px')}
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 6. CODE TAB (HTML+CSS, React)
      // ══════════════════════════════════════════════
      case 'code': {
        const fmt = (this.state.codeFormat === CODE_FORMATS.REACT) ? CODE_FORMATS.REACT : CODE_FORMATS.HTML_CSS;

        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${fmt === CODE_FORMATS.HTML_CSS ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.HTML_CSS}">HTML+CSS</button>
            <button class="segment-btn ${fmt === CODE_FORMATS.REACT ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.REACT}">React</button>
          </div>
        `;

        let codeOutput = '';
        if (fmt === CODE_FORMATS.REACT) {
          codeOutput = this.cachedAiReact || generateComponentCode(d, CODE_FORMATS.REACT, this.state.current.html, this.state.current.css);
        } else {
          const css = (this.state.current.css || this.state.original.css || '').trim();
          codeOutput = css
            ? `${this.state.current.html}\n\n<style>\n${css}\n</style>`
            : this.state.current.html;
        }

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row" style="font-size:10px;color:var(--q-text-muted);margin-bottom:4px;">
              <span>${fmt.toUpperCase()} • ${codeOutput.length} chars</span>
              <div style="display:flex;gap:4px;">
                ${fmt === CODE_FORMATS.REACT && this.llmConfig.isConfigured ? `
                  <button class="q-btn" id="generateAiReactBtn" ${this.isGeneratingAiReact ? 'disabled' : ''} style="padding:2px 8px;font-size:10px;">
                    ${this.isGeneratingAiReact ? '⚡ Generating...' : '⚡ Generate with AI'}
                  </button>
                ` : ''}
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${_esc(codeOutput)}" title="Copy Code">📋 Copy</button>
                <button class="icon-action-btn download-action-trigger" title="Download Code">↓ Download</button>
              </div>
            </div>
            <textarea class="q-textarea" style="min-height:280px;font-family:SFMono-Regular,Consolas,monospace;font-size:11px;" readonly>${_esc(codeOutput)}</textarea>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 7. EDIT TAB (Natural Language LLM Workflow)
      // ══════════════════════════════════════════════
      case 'edit': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>💬 Edit Component with AI</span></div>`;
        const editState = this.state.editState;

        body.innerHTML = `
          <div class="qursor-card">
            <div style="font-weight:700;font-size:12px;color:var(--q-text-primary);display:flex;align-items:center;justify-content:space-between;">
              <span>EDIT COMPONENT</span>
              <span class="node-badge">&lt;${(d.tag || 'div').toLowerCase()}&gt;</span>
            </div>
            <div style="font-size:11px;color:var(--q-text-muted);">
              Enter a natural language instruction to edit styling, layout, or content:
            </div>
            <textarea id="editInstructionArea" class="q-textarea" style="min-height:80px;" placeholder='Example: "Make the background blue, increase the padding to 20px, make the text bold and increase the width to 400px."'>${_esc(editState.instruction)}</textarea>
            
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
              <button class="q-btn" id="resetEditBtn" title="Revert to original component">↺ Reset</button>
              <button class="q-btn q-btn-primary" id="applyEditBtn" ${editState.isApplying ? 'disabled' : ''}>
                ${editState.isApplying ? '⚡ Applying with AI...' : '✓ Apply'}
              </button>
            </div>
          </div>

          ${editState.error ? `
            <div class="alert-box error">
              <strong>LLM request failed.</strong><br/>
              Your previous component has been preserved.<br/>
              <span style="font-size:10px;opacity:0.9;">Reason: ${_esc(editState.error)}</span>
            </div>
          ` : ''}

          ${this.state.current.changes.length > 0 ? `
            <div class="alert-box success">
              <strong>Recent Applied Changes:</strong>
              <ul style="margin:4px 0 0 16px;padding:0;">
                ${this.state.current.changes.map(c => `<li>${_esc(c)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="qursor-card">
            <div style="font-size:10px;color:var(--q-text-muted);line-height:1.6;">
              <strong style="color:var(--q-text-primary);">AI Edit Pipeline:</strong><br/>
              1. Your instruction + current HTML &amp; CSS are sent to the configured LLM.<br/>
              2. Structured updates are validated and applied to the component model.<br/>
              3. Live Preview and Code tabs immediately update with the modified component.<br/>
              4. Click <strong>"Reset"</strong> at any time to restore the original captured state.
            </div>
          </div>
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 8. ASSETS TAB
      // ══════════════════════════════════════════════
      case 'assets': {
        const rawAssets = this.state.original.assets;
        const filtered = filterAssets(rawAssets, this.state.assetFilter);

        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.state.assetFilter === 'All' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="All">All (${rawAssets.length})</button>
            <button class="segment-btn ${this.state.assetFilter === 'Images' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="Images">Images</button>
            <button class="segment-btn ${this.state.assetFilter === 'SVG' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="SVG">SVG</button>
            <button class="segment-btn ${this.state.assetFilter === 'PNG' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="PNG">PNG</button>
            <button class="segment-btn ${this.state.assetFilter === 'JPG' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="JPG">JPG</button>
            <button class="segment-btn ${this.state.assetFilter === 'WEBP' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="WEBP">WEBP</button>
            <button class="segment-btn ${this.state.assetFilter === 'GIF' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="GIF">GIF</button>
            <button class="segment-btn ${this.state.assetFilter === 'Other' ? 'active' : ''}" data-seg-group="assetFilter" data-seg-value="Other">Other</button>
          </div>
        `;

        body.innerHTML = `
          <div class="section-label-row">
            <span>DISCOVERED ASSETS (${filtered.length})</span>
            <span class="node-badge">${this.state.assetFilter}</span>
          </div>
          ${filtered.length === 0
            ? `<div class="qursor-card"><div class="empty-state"><div class="empty-state-icon">🖼️</div><div class="empty-state-title">No Assets Found</div><div class="empty-state-desc">No "${this.state.assetFilter}" assets found in this element's subtree.</div></div></div>`
            : `<div class="asset-grid">
                ${filtered.map(asset => `
                  <div class="asset-card-item">
                    <div class="asset-preview-card">
                      <img src="${_esc(asset.url)}" 
                           style="max-height:60px;max-width:100%;object-fit:contain;" 
                           onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='block';" 
                           alt="${_esc(asset.name)}" />
                      <div style="display:none;font-size:20px;color:var(--q-text-muted);">🖼️</div>
                    </div>
                    <div style="font-size:10px;font-weight:600;color:var(--q-text-primary);text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${_esc(asset.name)}">${_esc(asset.name)}</div>
                    <div style="font-size:9px;color:var(--q-text-muted);">${asset.format} • ${asset.width}</div>
                    <div style="display:flex;gap:4px;margin-top:2px;">
                      <button class="icon-action-btn copy-action-trigger" data-copy-text="${_esc(asset.url)}" title="Copy URL">📋</button>
                      <a href="${_esc(asset.url)}" download="${_esc(asset.name)}" target="_blank" class="icon-action-btn" style="text-decoration:none;" title="Open / Download">↓</a>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        `;
        break;
      }

      // ══════════════════════════════════════════════
      // 9. SETTINGS TAB (AI Configuration & Theme)
      // ══════════════════════════════════════════════
      case 'settings': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>⚙️ Extension Settings &amp; AI Configuration</span></div>`;
        const maskedKey = maskApiKey(this.llmConfig.apiKey);

        body.innerHTML = `
          <!-- AI Configuration Card -->
          <div class="qursor-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-weight:700;font-size:12px;color:var(--q-text-primary);">AI Configuration</span>
              <span class="status-pill-badge ${this.llmConfig.isConfigured ? 'configured' : 'not-configured'}">
                ${this.llmConfig.isConfigured ? '● Configured' : '○ Not Configured'}
              </span>
            </div>
            <div style="font-size:10px;color:var(--q-text-muted);margin-bottom:6px;">
              Required for natural language editing and AI React component generation.
            </div>

            <div class="prop-grid">
              <div class="prop-row">
                <span class="prop-label">API Key:</span>
                <input type="password" id="settingsApiKeyInput" class="q-input" 
                       placeholder="${this.llmConfig.isConfigured ? maskedKey : 'Enter your API key...'}" 
                       value="" />
              </div>

              <div class="prop-row">
                <span class="prop-label">Provider:</span>
                <select id="settingsProviderSelect" class="q-select" style="flex:1;">
                  <option value="gemini" ${this.llmConfig.provider === 'gemini' ? 'selected' : ''}>Google Gemini (Recommended)</option>
                  <option value="openai" ${this.llmConfig.provider === 'openai' ? 'selected' : ''}>OpenAI (GPT-4o)</option>
                  <option value="openrouter" ${this.llmConfig.provider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
                  <option value="groq" ${this.llmConfig.provider === 'groq' ? 'selected' : ''}>Groq (Llama 3.3)</option>
                </select>
              </div>

              <div class="prop-row">
                <span class="prop-label">Model:</span>
                <input type="text" id="settingsModelInput" class="q-input" 
                       value="${_esc(this.llmConfig.model || DEFAULT_MODELS[this.llmConfig.provider] || DEFAULT_GEMINI_MODEL)}" />
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:6px;">
              ${this.llmConfig.isConfigured ? `
                <button class="q-btn q-btn-danger" id="clearApiKeyBtn">Clear Key</button>
              ` : ''}
              <button class="q-btn q-btn-primary" id="saveApiKeyBtn">Save Configuration</button>
            </div>
          </div>

          <!-- Appearance Card -->
          <div class="qursor-card">
            <div style="font-weight:700;font-size:12px;color:var(--q-text-primary);margin-bottom:4px;">Appearance</div>
            <div class="prop-row">
              <span class="prop-label">Current Theme:</span>
              <span class="prop-value">${effectiveTheme === THEMES.DARK ? '🌙 Dark' : '☀️ Light'}</span>
            </div>
            <div class="prop-row" style="margin-top:4px;">
              <span class="prop-label">Toggle Theme:</span>
              <button class="q-btn" id="settingsThemeToggleBtn">
                Switch to ${effectiveTheme === THEMES.DARK ? '☀️ Light' : '🌙 Dark'} Mode
              </button>
            </div>
          </div>  
        `;
        break;
      }

      default: {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>Tab: ${this.state.activeTab}</span></div>`;
        body.innerHTML = `<div class="qursor-card"><div class="empty-state"><div class="empty-state-title">Tab Not Found</div></div></div>`;
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

// ─────────────────────────────────────────────────────────────────
// Module-level Utility Functions
// ─────────────────────────────────────────────────────────────────

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
