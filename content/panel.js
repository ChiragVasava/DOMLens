/**
 * Qursor++ - Floating Information Panel UI (Master Robust Implementation)
 * 
 * Re-architected with full event delegation, host site event propagation shields,
 * overflow text wrapping, interactive live style editor, zoom controls, asset scanner,
 * and multi-format code exporter.
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
    this.activeTab = 'live'; // 1. Live as 1st Feature
    this.userZoomScale = null;
    
    // Code tab state
    this.codeFormat = CODE_FORMATS.HTML_CSS_JS;
    this.codeScope = 'Selected'; // 'Selected' | 'Full Page'
    this.codeStyles = 'Computed'; // 'Computed' | 'Classes'

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

      .qursor-floating-panel {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 440px;
        background: var(--q-bg-primary, #f5f5f7);
        color: var(--q-text-primary, #1d1d1f);
        border: 1px solid var(--q-border, #e5e5ea);
        border-radius: 18px;
        box-shadow: var(--q-shadow-panel);
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, sans-serif;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        z-index: 2147483647;
        overflow: hidden;
        pointer-events: auto !important;
        resize: both;
        min-width: 360px;
        max-width: 560px;
        backdrop-filter: blur(20px);
        transition: background 0.2s, border-color 0.2s;
      }

      /* Navigation Header */
      .qursor-icon-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: var(--q-bg-surface, #ffffff);
        border-bottom: 1px solid var(--q-border-subtle);
        cursor: move;
        user-select: none;
      }

      .navbar-icons-group {
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;
      }
      .navbar-icons-group::-webkit-scrollbar { height: 0; }

      .nav-icon-btn {
        background: none;
        border: none;
        color: var(--q-text-muted, #86868b);
        padding: 4px 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.15s;
      }

      .nav-icon-btn:hover {
        background: var(--q-bg-hover);
        color: var(--q-text-primary);
      }

      .nav-icon-btn.active {
        background: var(--q-bg-surface-elevated, #e8e8ed);
        color: var(--q-text-primary, #1d1d1f);
        font-weight: 700;
      }

      .nav-actions-right {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .nav-action-btn {
        background: none;
        border: none;
        color: var(--q-text-muted);
        width: 24px;
        height: 24px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 13px;
      }
      .nav-action-btn:hover { color: var(--q-text-primary); background: var(--q-bg-hover); }

      /* Sub-Header Trigger / Search Bar */
      .qursor-trigger-bar {
        padding: 8px 12px;
        background: var(--q-bg-primary);
        border-bottom: 1px solid var(--q-border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .trigger-input-pill {
        background: var(--q-bg-surface, #ffffff);
        border: 1px solid var(--q-border, #e5e5ea);
        border-radius: 8px;
        padding: 5px 10px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--q-text-muted);
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        width: 100%;
        box-sizing: border-box;
      }

      /* Segment Pill Controls */
      .segment-pill-container {
        display: flex;
        background: var(--q-bg-surface-elevated, #e8e8ed);
        border-radius: 8px;
        padding: 2px;
        gap: 2px;
        width: 100%;
        overflow-x: auto;
      }

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
        background: var(--q-bg-surface, #ffffff);
        color: var(--q-text-primary, #1d1d1f);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
      }
      .zoom-btn:hover { background: var(--q-bg-surface-elevated); }

      /* Panel Body Card */
      .qursor-panel-body {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow-y: auto;
        max-height: 500px;
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
        box-sizing: border-box;
        overflow: hidden;
      }

      /* Grid Property Table with Strict Text Wrapping */
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
        min-width: 90px;
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
        max-width: 220px;
        text-align: right;
        justify-content: flex-end;
      }

      /* Checkerboard Asset Box */
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
        box-sizing: border-box;
      }

      .asset-preview-card {
        background-color: #ffffff;
        background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
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
        justify-content: center;
        gap: 6px;
        font-family: monospace;
        font-size: 10px;
      }

      .margin-box {
        border: 1px dashed #ff9500;
        background: rgba(255, 149, 0, 0.08);
        padding: 8px;
        border-radius: 6px;
        width: 85%;
        text-align: center;
      }

      .padding-box {
        border: 1px dashed #2563eb;
        background: rgba(37, 99, 235, 0.08);
        padding: 6px;
        border-radius: 4px;
        text-align: center;
      }

      .element-box {
        border: 1px solid #34c759;
        background: rgba(52, 199, 89, 0.15);
        padding: 4px;
        border-radius: 3px;
        color: #34c759;
        font-weight: bold;
      }

      .icon-action-btn {
        background: none;
        border: none;
        color: var(--q-text-muted);
        cursor: pointer;
        padding: 3px 6px;
        font-size: 11px;
        border-radius: 4px;
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
      }

      .q-btn-primary {
        background: var(--q-accent, #2563eb);
        color: #ffffff;
        border-color: var(--q-accent, #2563eb);
      }
    `;

    this.shadowRoot.appendChild(style);

    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'qursor-floating-panel';
    this.panelContainer.setAttribute('data-theme', THEMES.LIGHT);

    this.panelContainer.innerHTML = `
      <!-- Top Icon Navigation Header -->
      <div class="qursor-icon-navbar" id="panelHeader">
        <div class="navbar-icons-group">
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
          <span>👁️ Live Component Inspector</span>
        </div>
      </div>

      <!-- Main Body Container -->
      <div class="qursor-panel-body" id="panelBody">
        <!-- Rendered dynamically -->
      </div>
    `;

    this.shadowRoot.appendChild(this.panelContainer);
    this.themeManager.init();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const header = this.panelContainer.querySelector('#panelHeader');
    const closeBtn = this.panelContainer.querySelector('#panelCloseBtn');
    const themeToggleBtn = this.panelContainer.querySelector('#themeToggleBtn');
    const navGroup = this.panelContainer.querySelector('.navbar-icons-group');

    // Host Site Event Propagation Shield (Prevents GitHub/YouTube shortcuts from hijacking inputs inside panel)
    ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress', 'input', 'change'].forEach(evtType => {
      this.panelContainer.addEventListener(evtType, (e) => {
        e.stopPropagation();
      });
    });

    // Dragging Logic
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.nav-icon-btn') || e.target.closest('.nav-action-btn')) return;
      this.isDragging = true;
      const rect = this.panelContainer.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.panelContainer.style.bottom = 'auto';
      this.panelContainer.style.right = 'auto';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const left = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - this.dragOffsetX));
      const top = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - this.dragOffsetY));
      this.panelContainer.style.left = `${left}px`;
      this.panelContainer.style.top = `${top}px`;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Theme Toggle Button
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newTheme = this.themeManager.toggleTheme();
      themeToggleBtn.textContent = newTheme === THEMES.DARK ? '🌙' : '☀️';
      this.toastManager.show(`Switched to ${newTheme.toUpperCase()} mode`, 'info');
    });

    // Close Button
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      if (this.onClose) this.onClose();
    });

    // Navigation Tab Switch
    navGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-icon-btn');
      if (!btn) return;
      e.stopPropagation();

      const tabId = btn.dataset.tab;
      this.activeTab = tabId;

      navGroup.querySelectorAll('.nav-icon-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
      });

      this.renderTabContent();
    });

    // Delegated Event Listener on Entire Panel Container (Handles Header, TriggerBar & Body Clicks)
    this.panelContainer.addEventListener('click', async (e) => {
      const segBtn = e.target.closest('.segment-btn');
      const zoomBtn = e.target.closest('.zoom-btn');
      const copyBtn = e.target.closest('.copy-action-trigger');
      const downloadBtn = e.target.closest('.download-action-trigger');

      if (segBtn) {
        const segGroup = segBtn.dataset.segGroup;
        const value = segBtn.dataset.segValue;
        if (segGroup === 'codeFormat') this.codeFormat = value;
        if (segGroup === 'codeScope') this.codeScope = value;
        if (segGroup === 'codeStyles') this.codeStyles = value;
        if (segGroup === 'assetFilter') this.assetFilter = value;
        this.renderTabContent();
      }

      // Zoom Controls (In, Out, Fit, Reset)
      if (zoomBtn && this.currentData) {
        const action = zoomBtn.dataset.zoomAction;
        const targetWidth = this.currentData.widthPx && this.currentData.widthPx > 50 ? this.currentData.widthPx : 420;
        const targetHeight = this.currentData.heightPx && this.currentData.heightPx > 50 ? this.currentData.heightPx : 300;
        const autoScale = parseFloat(Math.min(390 / targetWidth, 240 / targetHeight, 1.0).toFixed(3));

        let currentZoom = this.userZoomScale !== null ? this.userZoomScale : autoScale;

        if (action === 'in') this.userZoomScale = parseFloat(Math.min(3.0, currentZoom + 0.15).toFixed(2));
        else if (action === 'out') this.userZoomScale = parseFloat(Math.max(0.15, currentZoom - 0.15).toFixed(2));
        else if (action === 'fit') this.userZoomScale = autoScale;
        else if (action === 'reset') this.userZoomScale = 1.0;

        this.renderTabContent();
      }

      // Apply Edits
      if (e.target.closest('#applyEditBtn') && this.currentData) {
        const textarea = this.panelContainer.querySelector('#editInstructionArea');
        if (textarea && textarea.value) {
          this.editInstructionText = textarea.value;
          this.styleEditor.parseAndApplyInstruction(textarea.value);
          this.currentData.rawCss = this.styleEditor.applyToRawCss(this.currentData.rawCss);
          
          if (this.targetElement) {
            Object.entries(this.styleEditor.customStyles).forEach(([p, v]) => {
              this.targetElement.style[p] = v;
            });
          }

          this.toastManager.show('✓ Style edits applied! Switching to Live view...', 'success');
          this.activeTab = 'live';
          this.updateNavTabs();
          this.renderTabContent();
        }
      }

      // Reset Edits
      if (e.target.closest('#resetEditBtn')) {
        this.styleEditor.reset();
        this.editInstructionText = '';
        this.toastManager.show('Reset style edits', 'info');
        this.renderTabContent();
      }

      // Copy Action
      if (copyBtn && this.currentData) {
        const text = copyBtn.dataset.copyText;
        if (text) {
          await copyToClipboard(text);
          this.toastManager.show('✓ Copied to clipboard!', 'success');
        }
      }

      // Download Action
      if (downloadBtn && this.currentData) {
        const content = generateComponentCode(this.currentData, this.codeFormat);
        const ext = this.codeFormat === CODE_FORMATS.REACT ? 'jsx' : (this.codeFormat === CODE_FORMATS.VUE ? 'vue' : (this.codeFormat === CODE_FORMATS.CSS_ONLY ? 'css' : 'html'));
        this.downloadFile(content, `${this.currentData.tag.toLowerCase()}_export.${ext}`);
        this.toastManager.show(`✓ Downloaded ${this.currentData.tag.toLowerCase()}_export.${ext}`, 'success');
      }
    });

    this.panelContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('edit-prop-input')) {
        const prop = e.target.dataset.styleProp;
        const val = e.target.value;
        if (prop && val) {
          this.styleEditor.setStyle(prop, val);
          this.currentData.rawCss = this.styleEditor.applyToRawCss(this.currentData.rawCss);
          if (this.targetElement) {
            this.targetElement.style[prop] = val;
          }
        }
      }
    });

    this.panelContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('prompt-target-select')) {
        this.promptFrameworkTarget = e.target.value;
        this.editedPromptText = null;
        this.renderTabContent();
      }
    });
  }

  updateNavTabs() {
    const navGroup = this.panelContainer.querySelector('.navbar-icons-group');
    if (navGroup) {
      navGroup.querySelectorAll('.nav-icon-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === this.activeTab);
      });
    }
  }

  updateData(data, element = null) {
    this.currentData = data;
    this.targetElement = element;
    this.userZoomScale = null;
    this.styleEditor.reset();
    this.editedPromptText = null;
    if (!data) return;
    this.show();
    this.renderTabContent();
  }

  renderTabContent() {
    const triggerBar = this.panelContainer.querySelector('#triggerBar');
    const body = this.panelContainer.querySelector('#panelBody');
    if (!body || !triggerBar) return;

    if (!this.currentData) {
      triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🔍 Click any element on webpage to inspect</span></div>`;
      body.innerHTML = `
        <div style="text-align:center; padding:32px 16px; color:var(--q-text-muted);">
          <div style="font-size:32px;">🎯</div>
          <div style="font-weight:700; margin-top:8px; color:var(--q-text-primary);">No Element Selected</div>
          <div style="font-size:11px; margin-top:4px;">Click any element to inspect live preview, overview, code, edits, assets, or prompts.</div>
        </div>
      `;
      return;
    }

    const d = this.currentData;

    switch (this.activeTab) {
      // 1. Live Tab (Live Component Preview & Zoom Controls)
      case 'live': {
        const targetWidth = d.widthPx && d.widthPx > 50 ? d.widthPx : 420;
        const targetHeight = d.heightPx && d.heightPx > 50 ? d.heightPx : 300;
        const autoScale = parseFloat(Math.min(390 / targetWidth, 240 / targetHeight, 1.0).toFixed(3));
        const activeZoom = this.userZoomScale !== null ? this.userZoomScale : autoScale;
        const scalePercent = Math.round(activeZoom * 100);

        triggerBar.innerHTML = `
          <div class="trigger-input-pill" style="justify-content:space-between; width:100%;">
            <span>👁️ Live Component Preview</span>
            <div class="zoom-controls-group">
              <button class="zoom-btn" data-zoom-action="out" title="Zoom Out">-</button>
              <button class="zoom-btn" data-zoom-action="fit" title="Fit Scale">Fit</button>
              <button class="zoom-btn" data-zoom-action="reset" title="100% Size">100%</button>
              <button class="zoom-btn" data-zoom-action="in" title="Zoom In">+</button>
              <span style="font-size:9px; background:var(--q-bg-surface-elevated); padding:2px 5px; border-radius:4px; font-weight:700;">${scalePercent}%</span>
            </div>
          </div>
        `;

        let renderableHtml = d.general.fullOuterHTML || '';
        const lowerTag = (d.general.tagName || '').toLowerCase();
        if (lowerTag === 'td' || lowerTag === 'th') {
          renderableHtml = `<table style="width:${targetWidth}px; border-collapse:collapse;"><tbody><tr>${renderableHtml}</tr></tbody></table>`;
        } else if (lowerTag === 'tr') {
          renderableHtml = `<table style="width:${targetWidth}px; border-collapse:collapse;"><tbody>${renderableHtml}</tbody></table>`;
        }

        const formattedCss = d.rawCss ? `.preview-target-box > * {\n${d.rawCss}\n}` : '';
        const srcDoc = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            ${d.pageStyles || ''}
            <style>
              html, body { margin: 0; padding: 12px; background: transparent; overflow: auto; display: flex; justify-content: center; }
              .preview-target-box {
                width: ${targetWidth}px !important;
                transform: scale(${activeZoom});
                transform-origin: top center;
              }
              ${formattedCss}
            </style>
          </head>
          <body>
            <div class="preview-target-box">${renderableHtml}</div>
          </body>
          </html>
        `;

        body.innerHTML = `
          <div class="section-label-row">
            <span>COMPONENT LIVE FRAME</span>
            <span class="node-badge">${targetWidth}×${targetHeight}px</span>
          </div>
          <div class="qursor-card" style="padding:4px;">
            <iframe style="width:100%; height:260px; border:none; border-radius:8px; background:var(--q-bg-surface);" srcdoc="${escapeHtml(srcDoc)}"></iframe>
          </div>
        `;
        break;
      }

      // 2. Overview Tab (2nd Feature: Detailed Element Metrics)
      case 'overview': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>ⓘ Detailed Overview & Metrics</span></div>`;
        const hexColor = (d.colors && d.colors.hexColor) ? d.colors.hexColor : rgbToHex(d.colors ? d.colors.color : '') || '#000000';
        const hexBg = (d.colors && d.colors.hexBgColor) ? d.colors.hexBgColor : rgbToHex(d.colors ? d.colors.backgroundColor : '') || '#FFFFFF';

        body.innerHTML = `
          <div class="section-label-row">
            <span>ELEMENT SUMMARY</span>
            <span class="node-badge">&lt;${d.tag}&gt;</span>
          </div>

          <!-- General Attributes Card -->
          <div class="qursor-card">
            <div style="font-weight:700; font-size:11px; margin-bottom:6px; color:var(--q-text-primary);">General Attributes</div>
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Tag Name</span><span class="prop-value">&lt;${d.general.tagName}&gt;</span></div>
              <div class="prop-row"><span class="prop-label">Element ID</span><span class="prop-value">${escapeHtml(d.general.id)}</span></div>
              <div class="prop-row"><span class="prop-label">CSS Classes</span><span class="prop-value">${d.classes.length ? escapeHtml(d.classes.join(', ')) : 'None'}</span></div>
              <div class="prop-row"><span class="prop-label">ARIA Role</span><span class="prop-value">${escapeHtml(d.general.role)}</span></div>
              <div class="prop-row"><span class="prop-label">Accessible Name</span><span class="prop-value">${escapeHtml(d.general.accessibleName || 'N/A')}</span></div>
              <div class="prop-row"><span class="prop-label">Value / Input</span><span class="prop-value">${escapeHtml(d.general.value)}</span></div>
            </div>
          </div>

          <!-- Typography & Colors Card -->
          <div class="qursor-card">
            <div style="font-weight:700; font-size:11px; margin-bottom:6px; color:var(--q-text-primary);">Typography & Color Palette</div>
            <div class="specimen-preview-box" style="font-family:${d.typography.fontFamily}; font-size:${d.typography.fontSize}; font-weight:${d.typography.fontWeight}; color:${hexColor}; background:${hexBg}; padding:10px; border-radius:6px; border:1px solid var(--q-border); margin-bottom:8px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${escapeHtml(d.general.textContent ? d.general.textContent.substring(0, 40) : 'AaBbCcDdEeFfGg 12345')}
            </div>
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Font Family</span><span class="prop-value">${escapeHtml(d.typography.fontFamily.split(',')[0].replace(/['"]/g, ''))}</span></div>
              <div class="prop-row"><span class="prop-label">Font Size / Weight</span><span class="prop-value">${d.typography.fontSize} • ${d.typography.fontWeight}</span></div>
              <div class="prop-row"><span class="prop-label">Line / Word Space</span><span class="prop-value">${d.typography.lineHeight || 'normal'} / ${d.typography.letterSpacing || 'normal'}</span></div>
              <div class="prop-row"><span class="prop-label">Text Align / Transform</span><span class="prop-value">${d.typography.textAlign || 'left'} / ${d.typography.textTransform || 'none'}</span></div>
              <div class="prop-row"><span class="prop-label">Text Color</span><span class="prop-value copy-action-trigger" data-copy-text="${hexColor}" style="cursor:pointer;"><span style="width:10px; height:10px; border-radius:2px; background:${hexColor}; border:1px solid rgba(128,128,128,0.3); display:inline-block; vertical-align:middle; margin-right:4px;"></span> ${hexColor} 📋</span></div>
              <div class="prop-row"><span class="prop-label">Background Color</span><span class="prop-value copy-action-trigger" data-copy-text="${hexBg}" style="cursor:pointer;"><span style="width:10px; height:10px; border-radius:2px; background:${hexBg}; border:1px solid rgba(128,128,128,0.3); display:inline-block; vertical-align:middle; margin-right:4px;"></span> ${hexBg} 📋</span></div>
            </div>
          </div>

          <!-- Layout & Spacing Box Model Card -->
          <div class="qursor-card">
            <div style="font-weight:700; font-size:11px; margin-bottom:6px; color:var(--q-text-primary);">Layout & Box Model Spacing</div>
            <div class="spacing-diagram" style="margin-bottom:8px;">
              <div class="margin-box" style="padding:6px; background:rgba(249, 115, 22, 0.1); border:1px dashed #f97316; border-radius:6px; font-size:9px; text-align:center; color:var(--q-text-primary);">
                <div style="font-weight:600; margin-bottom:4px;">MARGIN: ${d.spacing.margin || '0px'}</div>
                <div class="padding-box" style="padding:6px; background:rgba(34, 197, 94, 0.1); border:1px dashed #22c55e; border-radius:4px;">
                  <div style="font-weight:600; margin-bottom:4px;">PADDING: ${d.spacing.padding || '0px'}</div>
                  <div class="element-box" style="padding:4px; background:var(--q-bg-surface-elevated); border:1px solid var(--q-border); border-radius:3px; font-weight:700;">
                    &lt;${d.tag}&gt; ${d.widthPx}×${d.heightPx}px
                  </div>
                </div>
              </div>
            </div>
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Display Mode</span><span class="prop-value">${d.layout.display || 'block'}</span></div>
              <div class="prop-row"><span class="prop-label">Position / Z-Index</span><span class="prop-value">${d.layout.position || 'static'} (z: ${d.layout.zIndex || 'auto'})</span></div>
              <div class="prop-row"><span class="prop-label">Flex Direction</span><span class="prop-value">${(d.flexGrid && d.flexGrid.flexDirection) ? d.flexGrid.flexDirection : 'N/A'}</span></div>
              <div class="prop-row"><span class="prop-label">Flex Align / Justify</span><span class="prop-value">${(d.flexGrid && d.flexGrid.alignItems) ? d.flexGrid.alignItems : 'N/A'} / ${(d.flexGrid && d.flexGrid.justifyContent) ? d.flexGrid.justifyContent : 'N/A'}</span></div>
              <div class="prop-row"><span class="prop-label">Gap / Box Sizing</span><span class="prop-value">${d.spacing.gap || '0px'} / ${d.layout.boxSizing || 'border-box'}</span></div>
            </div>
          </div>

          <!-- DOM Tree & Hierarchy Card -->
          <div class="qursor-card">
            <div style="font-weight:700; font-size:11px; margin-bottom:6px; color:var(--q-text-primary);">DOM Hierarchy & Selectors</div>
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Parent Tag</span><span class="prop-value">&lt;${d.dom.parentTag || 'N/A'}&gt; ${d.dom.parentId ? '#' + escapeHtml(d.dom.parentId) : ''}</span></div>
              <div class="prop-row"><span class="prop-label">DOM Tree Depth</span><span class="prop-value">Level ${d.dom.depth || 1}</span></div>
              <div class="prop-row"><span class="prop-label">Child Element Count</span><span class="prop-value">${d.dom.childrenCount || 0} nodes ${d.dom.childTags && d.dom.childTags.length ? '(' + escapeHtml(d.dom.childTags.join(', ')) + ')' : ''}</span></div>
              <div class="prop-row"><span class="prop-label">Siblings (Prev / Next)</span><span class="prop-value">&lt;${d.dom.previousSiblingTag || 'None'}&gt; / &lt;${d.dom.nextSiblingTag || 'None'}&gt;</span></div>
              <div class="prop-row"><span class="prop-label">CSS Selector</span><span class="prop-value copy-action-trigger" data-copy-text="${escapeHtml(d.selector)}" style="cursor:pointer;">${escapeHtml(d.selector)} 📋</span></div>
              <div class="prop-row"><span class="prop-label">XPath</span><span class="prop-value copy-action-trigger" data-copy-text="${escapeHtml(d.xpath)}" style="cursor:pointer;">${escapeHtml(d.xpath)} 📋</span></div>
            </div>
          </div>
        `;
        break;
      }

      // 3. Code Tab (3rd Feature: Separated HTML, CSS, JS, HTML+CSS+JS, React, Vue, Angular, Tailwind)
      case 'code': {
        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.HTML_ONLY ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.HTML_ONLY}">HTML</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.CSS_ONLY ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.CSS_ONLY}">CSS</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.JS_ONLY ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.JS_ONLY}">JS</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.HTML_CSS_JS ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.HTML_CSS_JS}">HTML+CSS+JS</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.REACT ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.REACT}">React</button>
            <button class="segment-btn ${this.codeFormat === CODE_FORMATS.VUE ? 'active' : ''}" data-seg-group="codeFormat" data-seg-value="${CODE_FORMATS.VUE}">Vue</button>
          </div>
        `;

        let codeText = '';
        if (this.codeScope === 'Full Page') {
          codeText = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${escapeHtml(document.title)}</title>\n${d.pageStyles || ''}\n</head>\n<body>\n${document.body.outerHTML}\n</body>\n</html>`;
        } else {
          codeText = generateComponentCode(d, this.codeFormat);
        }

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Scope</span>
              <div class="segment-pill-container" style="width:160px;">
                <button class="segment-btn ${this.codeScope === 'Selected' ? 'active' : ''}" data-seg-group="codeScope" data-seg-value="Selected">Selected</button>
                <button class="segment-btn ${this.codeScope === 'Full Page' ? 'active' : ''}" data-seg-group="codeScope" data-seg-value="Full Page">Full Page</button>
              </div>
            </div>
            <div class="prop-row">
              <span class="prop-label">Styles</span>
              <div class="segment-pill-container" style="width:160px;">
                <button class="segment-btn ${this.codeStyles === 'Computed' ? 'active' : ''}" data-seg-group="codeStyles" data-seg-value="Computed">Computed</button>
                <button class="segment-btn ${this.codeStyles === 'Classes' ? 'active' : ''}" data-seg-group="codeStyles" data-seg-value="Classes">Classes</button>
              </div>
            </div>
          </div>

          <div class="qursor-card">
            <div class="prop-row" style="font-size:10px; color:var(--q-text-muted);">
              <span>${d.widthPx}×${d.heightPx} • ${d.dom.childCount || 1} nodes • ${this.codeFormat.toUpperCase()}</span>
              <div style="display:flex; gap:4px;">
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${escapeHtml(codeText)}" title="Copy Code">📋 Copy</button>
                <button class="icon-action-btn download-action-trigger" title="Download File">↓ Download</button>
              </div>
            </div>
            <textarea style="width:100%; min-height:160px; background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:8px; font-family:monospace; font-size:10px; outline:none;" readonly>${escapeHtml(codeText)}</textarea>
          </div>
        `;
        break;
      }

      // 4. Edit Tab (4th Feature: Interactive Property Mutation & Instruction Parser)
      case 'edit': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>▾ Edit & Annotate &lt;${d.tag.toLowerCase()}&gt;</span></div>`;
        const hex = rgbToHex(d.colors.color) || '#ffffff';
        const bgHex = rgbToHex(d.colors.backgroundColor) || '#000000';

        body.innerHTML = `
          <div class="qursor-card">
            <div style="font-weight:700; font-size:11px;">Direct Style Modifications</div>
            <div class="prop-row"><span class="prop-label">color:</span><input type="text" class="edit-prop-input" data-style-prop="color" style="width:100px; text-align:right;" value="${hex}" /></div>
            <div class="prop-row"><span class="prop-label">background-color:</span><input type="text" class="edit-prop-input" data-style-prop="backgroundColor" style="width:100px; text-align:right;" value="${bgHex}" /></div>
            <div class="prop-row"><span class="prop-label">font-size:</span><input type="text" class="edit-prop-input" data-style-prop="fontSize" style="width:100px; text-align:right;" value="${d.typography.fontSize}" /></div>
            <div class="prop-row"><span class="prop-label">font-weight:</span><input type="text" class="edit-prop-input" data-style-prop="fontWeight" style="width:100px; text-align:right;" value="${d.typography.fontWeight}" /></div>
            <div class="prop-row"><span class="prop-label">border-radius:</span><input type="text" class="edit-prop-input" data-style-prop="borderRadius" style="width:100px; text-align:right;" value="${d.border.borderRadius}" /></div>
          </div>

          <div class="qursor-card">
            <div style="font-weight:700; font-size:11px;">Natural Language CSS Instruction</div>
            <textarea id="editInstructionArea" style="width:100%; min-height:50px; background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:6px; font-size:11px;" placeholder="e.g. Make background blue, set font size to 24px...">${escapeHtml(this.editInstructionText)}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:6px;">
              <button class="q-btn" id="resetEditBtn">Reset</button>
              <button class="q-btn q-btn-primary" id="applyEditBtn">Apply Edits</button>
            </div>
          </div>
        `;
        break;
      }

      // 5. Assets Tab (5th Feature: Full Subtree Media Scanner & YouTube Thumbnail Support)
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

          ${filtered.length === 0 ? `
            <div class="qursor-card" style="text-align:center; padding:20px; color:var(--q-text-muted);">
              No media assets detected for "${this.assetFilter}" filter.
            </div>
          ` : `
            <div class="asset-grid">
              ${filtered.map(asset => `
                <div class="asset-card-item">
                  <div class="asset-preview-card">
                    ${asset.type === 'SVG' && asset.url.startsWith('data:image/svg') 
                      ? `<img src="${asset.url}" style="max-height:60px; max-width:80%; object-fit:contain;" />`
                      : `<img src="${asset.url}" style="max-height:60px; max-width:80%; object-fit:contain;" onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=Asset';" />`}
                  </div>
                  <div style="font-size:10px; font-weight:600; color:var(--q-text-primary); text-align:center; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${escapeHtml(asset.name)}
                  </div>
                  <div style="font-size:9px; color:var(--q-text-muted);">${asset.format} • ${asset.width}</div>
                  <div style="display:flex; gap:4px; margin-top:2px;">
                    <button class="icon-action-btn copy-action-trigger" data-copy-text="${escapeHtml(asset.url)}" title="Copy URL">📋</button>
                    <a href="${asset.url}" download="${asset.name}" target="_blank" class="icon-action-btn" title="Download Asset" style="text-decoration:none;">↓</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        `;
        break;
      }

      // 6. Prompt Tab (6th Feature: Structured AI Prompt Builder)
      case 'prompt': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>👤 AI Prompt Builder</span></div>`;
        const promptContent = this.editedPromptText || generateStructuredAiPrompt(d, this.promptFrameworkTarget);

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Target Framework</span>
              <select class="prompt-target-select" style="background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:3px 6px; font-size:10px;">
                <option value="React" ${this.promptFrameworkTarget === 'React' ? 'selected' : ''}>React</option>
                <option value="Next.js" ${this.promptFrameworkTarget === 'Next.js' ? 'selected' : ''}>Next.js</option>
                <option value="Vue 3" ${this.promptFrameworkTarget === 'Vue 3' ? 'selected' : ''}>Vue 3</option>
                <option value="Angular" ${this.promptFrameworkTarget === 'Angular' ? 'selected' : ''}>Angular</option>
                <option value="Tailwind CSS" ${this.promptFrameworkTarget === 'Tailwind CSS' ? 'selected' : ''}>Tailwind CSS</option>
              </select>
            </div>
          </div>

          <div class="qursor-card">
            <textarea style="width:100%; min-height:170px; background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:8px; font-family:monospace; font-size:10px; outline:none; white-space:pre-wrap;">${escapeHtml(promptContent)}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:6px;">
              <button class="q-btn copy-action-trigger" data-copy-text="${escapeHtml(promptContent)}">📋 Copy AI Prompt</button>
            </div>
          </div>
        `;
        break;
      }

      // 7. Settings Tab (7th Feature: Theme Switcher & Shortcuts)
      case 'settings': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>⚙️ Extension Settings</span></div>`;
        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Theme Mode</span>
              <button class="q-btn" id="settingsThemeToggleBtn">Toggle Light/Dark Theme</button>
            </div>
            <div class="prop-row">
              <span class="prop-label">Shortcut Toggle</span>
              <span class="prop-value">Ctrl + Shift + I</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">Exit Inspect Mode</span>
              <span class="prop-value">ESC</span>
            </div>
          </div>
        `;
        break;
      }
    }

    this.shadowRoot._panel = this;
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  show() {
    if (this.panelContainer) this.panelContainer.style.display = 'flex';
  }

  hide() {
    if (this.panelContainer) this.panelContainer.style.display = 'none';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function rgbToHex(colorStr) {
  if (!colorStr) return '';
  if (colorStr.startsWith('#')) return colorStr;
  const match = colorStr.match(/\d+/g);
  if (match && match.length >= 3) {
    const r = parseInt(match[0], 10).toString(16).padStart(2, '0').toUpperCase();
    const g = parseInt(match[1], 10).toString(16).padStart(2, '0').toUpperCase();
    const b = parseInt(match[2], 10).toString(16).padStart(2, '0').toUpperCase();
    return `#${r}${g}${b}`;
  }
  return '';
}
