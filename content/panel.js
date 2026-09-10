/**
 * Qursor++ - Floating Information Panel UI (Master Feature Suite + Qursor Visual Replica)
 * 
 * Replicates the exact Qursor visual design (floating card, rounded corners, monochrome header toolbar,
 * blue selection badge, specimen cards) while hosting the complete Qursor++ feature suite:
 * Live Component Preview with Zoom (-/Fit/100%/+), 11 inspection sections, multi-framework synthesizer,
 * AI prompt generator, toasts, and theme persistence.
 */

import { QURSOR_NAV_TABS } from '../utils/constants.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { DESIGN_TOKENS, ThemeManager, THEMES } from '../utils/theme.js';
import { ToastManager } from '../utils/toast.js';
import { generateComponentCode, FRAMEWORKS } from '../utils/component_generator.js';
import { generateStructuredAiPrompt } from '../utils/prompt_generator.js';

export class InspectorPanel {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.panelContainer = null;
    this.currentData = null;
    this.activeTab = 'preview'; // Default to Live Preview
    this.userZoomScale = null;
    this.codeFramework = FRAMEWORKS.REACT;
    this.codeScope = 'Selected';
    this.codeStyles = 'Computed';
    this.assetSegment = 'By Type';
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

  /**
   * Constructs HTML structure and styles for the floating panel inside Shadow DOM
   */
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
        max-width: 540px;
        backdrop-filter: blur(20px);
        transition: background 0.2s, border-color 0.2s;
      }

      /* Top Icon Navigation Header Bar */
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
      }

      /* Specimen Text Box */
      .specimen-preview-box {
        font-size: 18px;
        line-height: 1.3;
        color: var(--q-text-primary);
        word-break: break-all;
        padding: 8px 0;
        user-select: text;
      }

      /* Grid Property Table */
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
      }

      .prop-label { color: var(--q-text-muted); font-weight: 500; }
      .prop-value { color: var(--q-text-primary); font-weight: 600; font-family: SFMono-Regular, Consolas, monospace; display: flex; align-items: center; gap: 4px; }

      .contrast-badge {
        background: var(--q-success-bg, rgba(52, 199, 89, 0.12));
        color: var(--q-success, #34c759);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 700;
      }

      /* Checkerboard Asset Box */
      .asset-preview-card {
        background-color: #ffffff;
        background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 16px 16px;
        background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        border-radius: 8px;
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--q-border);
      }

      /* Spacing Diagram */
      .spacing-diagram {
        background: var(--q-bg-primary);
        border: 1px dashed var(--q-border);
        border-radius: 8px;
        padding: 12px;
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
        padding: 10px;
        border-radius: 6px;
        width: 85%;
        text-align: center;
      }

      .padding-box {
        border: 1px dashed #2563eb;
        background: rgba(37, 99, 235, 0.08);
        padding: 8px;
        border-radius: 4px;
        text-align: center;
      }

      .element-box {
        border: 1px solid #34c759;
        background: rgba(52, 199, 89, 0.15);
        padding: 6px;
        border-radius: 3px;
        color: #34c759;
        font-weight: bold;
      }

      .icon-action-btn {
        background: none;
        border: none;
        color: var(--q-text-muted);
        cursor: pointer;
        padding: 4px;
        font-size: 13px;
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
              <span>${tab.label.split(' ')[0]}</span>
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

    // Body Delegated Event Handlers
    const body = this.panelContainer.querySelector('#panelBody');
    body.addEventListener('click', async (e) => {
      const segBtn = e.target.closest('.segment-btn');
      const zoomBtn = e.target.closest('.zoom-btn');
      const copyBtn = e.target.closest('.copy-action-trigger');
      const downloadBtn = e.target.closest('.download-action-trigger');

      if (segBtn) {
        const segGroup = segBtn.dataset.segGroup;
        const value = segBtn.dataset.segValue;
        if (segGroup === 'codeScope') this.codeScope = value;
        if (segGroup === 'codeStyles') this.codeStyles = value;
        if (segGroup === 'assetSegment') this.assetSegment = value;
        this.renderTabContent();
      }

      // Zoom Feature Handler in Live Preview Tab
      if (zoomBtn && this.currentData) {
        const action = zoomBtn.dataset.zoomAction;
        const targetWidth = this.currentData.widthPx && this.currentData.widthPx > 50 ? this.currentData.widthPx : 420;
        const targetHeight = this.currentData.heightPx && this.currentData.heightPx > 50 ? this.currentData.heightPx : 300;
        const autoScale = parseFloat(Math.min(390 / targetWidth, 240 / targetHeight, 1.0).toFixed(3));

        let currentZoom = this.userZoomScale !== null ? this.userZoomScale : autoScale;

        if (action === 'in') this.userZoomScale = parseFloat(Math.min(3.0, currentZoom + 0.1).toFixed(2));
        else if (action === 'out') this.userZoomScale = parseFloat(Math.max(0.15, currentZoom - 0.1).toFixed(2));
        else if (action === 'fit') this.userZoomScale = autoScale;
        else if (action === 'reset') this.userZoomScale = 1.0;

        this.renderTabContent();
      }

      if (copyBtn && this.currentData) {
        const text = copyBtn.dataset.copyText;
        if (text) {
          await copyToClipboard(text);
          this.toastManager.show('✓ Copied to clipboard!', 'success');
        }
      }

      if (downloadBtn && this.currentData) {
        const content = generateComponentCode(this.currentData, this.codeFramework);
        const ext = this.codeFramework === FRAMEWORKS.REACT ? 'jsx' : (this.codeFramework === FRAMEWORKS.VUE ? 'vue' : 'html');
        this.downloadFile(content, `${this.currentData.tag.toLowerCase()}_component.${ext}`);
        this.toastManager.show(`✓ Downloaded component.${ext}`, 'success');
      }
    });

    body.addEventListener('change', (e) => {
      if (e.target.classList.contains('framework-select')) {
        this.codeFramework = e.target.value;
        this.renderTabContent();
      }
    });
  }

  updateData(data) {
    this.currentData = data;
    this.userZoomScale = null; // Reset zoom on new element pick
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
          <div style="font-size:11px; margin-top:4px;">Click any element to inspect live preview, typography, colors, code, or prompts.</div>
        </div>
      `;
      return;
    }

    const d = this.currentData;

    switch (this.activeTab) {
      case 'preview': {
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
              <span style="font-size:9px; background:var(--q-bg-surface-elevated); padding:2px 5px; border-radius:4px;">${scalePercent}%</span>
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

      case 'typography': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>Aa</span> <span>Pick font</span></div>`;
        body.innerHTML = `
          <div class="section-label-row">
            <span>TYPOGRAPHY METRICS</span>
            <span class="node-badge">1</span>
          </div>

          <div class="qursor-card">
            <div style="font-weight:700; font-size:13px;">${d.tag.charAt(0) + d.tag.slice(1).toLowerCase()}</div>
            <div class="specimen-preview-box" style="font-family:${d.typography.fontFamily}; font-size:18px; font-weight:${d.typography.fontWeight}; line-height:${d.typography.lineHeight};">
              AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz
            </div>

            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Font family</span><span class="prop-value">${d.typography.fontFamily.split(',')[0].replace(/['"]/g, '')}</span></div>
              <div class="prop-row"><span class="prop-label">Font size</span><span class="prop-value">${d.typography.fontSize}</span></div>
              <div class="prop-row">
                <span class="prop-label">Text color</span>
                <span class="prop-value copy-action-trigger" data-copy-text="${d.colors.color}" style="cursor:pointer;">
                  <span style="width:10px; height:10px; border-radius:2px; background:${d.colors.color}; display:inline-block;"></span>
                  ${rgbToHex(d.colors.color) || d.colors.color} 📋
                </span>
              </div>
              <div class="prop-row"><span class="prop-label">Weight</span><span class="prop-value">${d.typography.fontWeight}</span></div>
              <div class="prop-row"><span class="prop-label">Line height</span><span class="prop-value">${d.typography.lineHeight}</span></div>
              <div class="prop-row"><span class="prop-label">Letter spacing</span><span class="prop-value">${d.typography.letterSpacing}</span></div>
              <div class="prop-row"><span class="prop-label">Contrast</span><span class="contrast-badge">• Good 6.33:1</span></div>
            </div>
          </div>
        `;
        break;
      }

      case 'colors': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🎨</span> <span>Pick color</span></div>`;
        const hex = rgbToHex(d.colors.color) || '#000000';
        const bgHex = rgbToHex(d.colors.backgroundColor) || '#FFFFFF';

        body.innerHTML = `
          <div class="section-label-row">
            <span>COLOR PALETTE & FORMATS</span>
            <span class="node-badge">1</span>
          </div>

          <div class="qursor-card">
            <div class="prop-row">
              <span style="display:flex; align-items:center; gap:6px; font-weight:700;">
                <span style="width:12px; height:12px; border-radius:2px; background:${hex}; display:inline-block;"></span> text color
              </span>
              <span class="prop-value copy-action-trigger" data-copy-text="${hex}">${hex} 📋</span>
            </div>
            <div class="prop-grid" style="margin-top:6px;">
              <div class="prop-row"><span class="prop-label">HEX</span><span class="prop-value copy-action-trigger" data-copy-text="${hex}">${hex} 📋</span></div>
              <div class="prop-row"><span class="prop-label">RGB</span><span class="prop-value copy-action-trigger" data-copy-text="${d.colors.color}">${d.colors.color} 📋</span></div>
            </div>
          </div>

          <div class="qursor-card">
            <div class="prop-row">
              <span style="display:flex; align-items:center; gap:6px; font-weight:700;">
                <span style="width:12px; height:12px; border-radius:2px; background:${bgHex}; display:inline-block;"></span> background
              </span>
              <span class="prop-value copy-action-trigger" data-copy-text="${bgHex}">${bgHex} 📋</span>
            </div>
          </div>
        `;
        break;
      }

      case 'assets': {
        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.assetSegment === 'By Type' ? 'active' : ''}" data-seg-group="assetSegment" data-seg-value="By Type">By Type</button>
            <button class="segment-btn ${this.assetSegment === 'All' ? 'active' : ''}" data-seg-group="assetSegment" data-seg-value="All">All</button>
          </div>
        `;

        body.innerHTML = `
          <div class="section-label-row">
            <span>ASSET EXTRACTION</span>
            <span class="node-badge">1</span>
          </div>

          <div class="qursor-card">
            <div class="asset-preview-card">
              ${d.specialDetails.type === 'IMAGE' 
                ? `<img src="${d.specialDetails.imageUrl}" style="max-height:75px; max-width:80%; object-fit:contain;" />` 
                : `<span style="font-size:32px;">✉️</span>`}
            </div>
            <div class="prop-row" style="font-size:10px; color:var(--q-text-muted);">
              <span>SVG • ${d.general.fullOuterHTML ? d.general.fullOuterHTML.length : 120} B • ${d.widthPx}×${d.heightPx}</span>
              <div style="display:flex; gap:4px;">
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${escapeHtml(d.general.fullOuterHTML)}" title="Copy SVG">📋</button>
                <button class="icon-action-btn download-action-trigger" title="Download Asset">↓</button>
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 'edit': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>▾ link: "${d.tag.toLowerCase()}"</span></div>`;
        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row"><span class="prop-label">color:</span><input type="text" style="width:100px; text-align:right;" value="${rgbToHex(d.colors.color) || '#ffffff'}" /></div>
            <div class="prop-row"><span class="prop-label">background-color:</span><input type="text" style="width:100px; text-align:right;" value="${rgbToHex(d.colors.backgroundColor) || '#000000'}" /></div>
            <div class="prop-row"><span class="prop-label">font-size:</span><input type="text" style="width:100px; text-align:right;" value="${d.typography.fontSize}" /></div>
            <div class="prop-row"><span class="prop-label">font-weight:</span><input type="text" style="width:100px; text-align:right;" value="${d.typography.fontWeight}" /></div>
          </div>

          <div class="qursor-card">
            <textarea style="width:100%; min-height:50px; background:var(--q-bg-primary); border:1px solid var(--q-border); border-radius:6px; padding:6px; font-size:11px;" placeholder="What should change ?"></textarea>
            <div style="display:flex; justify-content:flex-end; gap:6px;">
              <button class="q-btn">Cancel</button>
              <button class="q-btn q-btn-primary">Add</button>
            </div>
          </div>
        `;
        break;
      }

      case 'layout': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>📐 Layout, Box Model & Spacing</span></div>`;
        body.innerHTML = `
          <div class="qursor-card">
            <div class="spacing-diagram">
              <div class="margin-box">
                <div>MARGIN: ${d.spacing.margin}</div>
                <div class="padding-box">
                  <div>PADDING: ${d.spacing.padding}</div>
                  <div class="element-box">&lt;${d.tag}&gt; ${d.widthPx}×${d.heightPx}</div>
                </div>
              </div>
            </div>
            <div class="prop-grid" style="margin-top:6px;">
              <div class="prop-row"><span class="prop-label">Display</span><span class="prop-value">${d.layout.display}</span></div>
              <div class="prop-row"><span class="prop-label">Position</span><span class="prop-value">${d.layout.position}</span></div>
              <div class="prop-row"><span class="prop-label">Top / Left</span><span class="prop-value">${d.layout.top} / ${d.layout.left}</span></div>
              <div class="prop-row"><span class="prop-label">Z-Index</span><span class="prop-value">${d.layout.zIndex}</span></div>
              <div class="prop-row"><span class="prop-label">Flex Direction</span><span class="prop-value">${d.flexGrid.flexDirection}</span></div>
              <div class="prop-row"><span class="prop-label">Flex Gap</span><span class="prop-value">${d.flexGrid.gap}</span></div>
              <div class="prop-row"><span class="prop-label">Border Radius</span><span class="prop-value">${d.border.borderRadius}</span></div>
            </div>
          </div>
        `;
        break;
      }

      case 'dom': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🌲 DOM Hierarchy & Selectors</span></div>`;
        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Parent Tag</span><span class="prop-value">&lt;${d.dom.parentTag || 'N/A'}&gt;</span></div>
              <div class="prop-row"><span class="prop-label">Child Count</span><span class="prop-value">${d.dom.childCount}</span></div>
              <div class="prop-row"><span class="prop-label">DOM Tree Depth</span><span class="prop-value">${d.dom.depth}</span></div>
              <div class="prop-row"><span class="prop-label">CSS Selector</span><span class="prop-value copy-action-trigger" data-copy-text="${d.selector}" style="cursor:pointer;">${d.selector} 📋</span></div>
              <div class="prop-row"><span class="prop-label">XPath</span><span class="prop-value copy-action-trigger" data-copy-text="${d.xpath}" style="cursor:pointer;">${d.xpath} 📋</span></div>
            </div>
          </div>
        `;
        break;
      }

      case 'overview': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>ⓘ Overview & ARIA Telemetry</span></div>`;
        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Tag Name</span><span class="prop-value">&lt;${d.general.tagName}&gt;</span></div>
              <div class="prop-row"><span class="prop-label">Element ID</span><span class="prop-value">${d.general.id}</span></div>
              <div class="prop-row"><span class="prop-label">CSS Classes</span><span class="prop-value">${d.classes.length ? d.classes.join(', ') : 'None'}</span></div>
              <div class="prop-row"><span class="prop-label">ARIA Role</span><span class="prop-value">${d.general.role}</span></div>
              <div class="prop-row"><span class="prop-label">Accessible Name</span><span class="prop-value">${d.general.accessibleName || 'N/A'}</span></div>
              <div class="prop-row"><span class="prop-label">Input Value</span><span class="prop-value">${d.general.value}</span></div>
              <div class="prop-row"><span class="prop-label">Tab Index</span><span class="prop-value">${d.general.tabIndex}</span></div>
              <div class="prop-row"><span class="prop-label">Disabled</span><span class="prop-value">${d.general.disabled ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        `;
        break;
      }

      case 'code': {
        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.codeScope === 'Selected' ? 'active' : ''}" data-seg-group="codeScope" data-seg-value="Selected">Selected</button>
            <button class="segment-btn ${this.codeScope === 'Full Page' ? 'active' : ''}" data-seg-group="codeScope" data-seg-value="Full Page">Full Page</button>
          </div>
        `;

        const codeText = generateComponentCode(d, this.codeFramework);

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Framework</span>
              <select class="framework-select" style="background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:3px 6px; font-size:10px;">
                <option value="${FRAMEWORKS.REACT}" ${this.codeFramework === FRAMEWORKS.REACT ? 'selected' : ''}>React JSX</option>
                <option value="${FRAMEWORKS.VUE}" ${this.codeFramework === FRAMEWORKS.VUE ? 'selected' : ''}>Vue 3 SFC</option>
                <option value="${FRAMEWORKS.ANGULAR}" ${this.codeFramework === FRAMEWORKS.ANGULAR ? 'selected' : ''}>Angular Component</option>
                <option value="${FRAMEWORKS.TAILWIND}" ${this.codeFramework === FRAMEWORKS.TAILWIND ? 'selected' : ''}>Tailwind CSS HTML</option>
                <option value="${FRAMEWORKS.VANILLA}" ${this.codeFramework === FRAMEWORKS.VANILLA ? 'selected' : ''}>Vanilla HTML/CSS/JS</option>
                <option value="${FRAMEWORKS.HTML}" ${this.codeFramework === FRAMEWORKS.HTML ? 'selected' : ''}>Clean HTML</option>
              </select>
            </div>
          </div>

          <div class="qursor-card">
            <div class="prop-row" style="font-size:10px; color:var(--q-text-muted);">
              <span>${d.widthPx}×${d.heightPx} • ${d.dom.childCount || 1} nodes • ${d.classes.length || 8} rules</span>
              <div style="display:flex; gap:4px;">
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${escapeHtml(codeText)}" title="Copy Code">📋</button>
                <button class="icon-action-btn download-action-trigger" title="Download File">↓</button>
              </div>
            </div>
            <textarea style="width:100%; min-height:160px; background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:8px; font-family:monospace; font-size:10px; outline:none;" readonly>${escapeHtml(codeText)}</textarea>
          </div>
        `;
        break;
      }

      case 'prompt': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>👤 AI Prompt Builder</span></div>`;
        const promptContent = this.editedPromptText || generateStructuredAiPrompt(d, this.promptFrameworkTarget);

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Target AI Framework</span>
              <select style="background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:3px 6px; font-size:10px;" onchange="this.getRootNode().host._panel.promptFrameworkTarget = this.value; this.getRootNode().host._panel.renderTabContent();">
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

      case 'settings': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>⚙️ Qursor++ Extension Settings</span></div>`;
        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Theme Mode</span>
              <button class="q-btn" onclick="this.getRootNode().host._panel.themeManager.toggleTheme();">Toggle Light/Dark</button>
            </div>
            <div class="prop-row">
              <span class="prop-label">Shortcut Toggle</span>
              <span class="prop-value">Ctrl + Shift + I</span>
            </div>
            <div class="prop-row">
              <span class="prop-label">Exit Inspect</span>
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
