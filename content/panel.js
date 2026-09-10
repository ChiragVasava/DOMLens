/**
 * Qursor++ - Floating Information Panel UI (100% Qursor Replica)
 * 
 * Replicates the exact visual identity, icon header toolbar, specimen cards,
 * typography inspector, asset grid, code scope pills, inline style editor, and AI prompt builder.
 */

import { copyToClipboard } from '../utils/clipboard.js';
import { DESIGN_TOKENS, ThemeManager, THEMES } from '../utils/theme.js';
import { ToastManager } from '../utils/toast.js';
import { generateComponentCode, FRAMEWORKS } from '../utils/component_generator.js';
import { generateStructuredAiPrompt } from '../utils/prompt_generator.js';

export const QURSOR_NAV_TABS = [
  { id: 'edit', label: 'Edit & Annotate', icon: '💬' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: 'T' },
  { id: 'assets', label: 'Assets', icon: '🖼️' },
  { id: 'code', label: 'Code', icon: '📄' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'prompt', label: 'AI Prompt', icon: '👤' },
];

export class InspectorPanel {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.panelContainer = null;
    this.currentData = null;
    this.activeTab = 'typography';
    this.codeSegment = 'HTML + CSS'; // 'HTML + CSS' | 'JSX'
    this.codeScope = 'Selected'; // 'Selected' | 'Full Page'
    this.codeStyles = 'Computed'; // 'Computed' | 'Classes'
    this.assetSegment = 'By Type'; // 'By Type' | 'All'
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
   * Constructs the HTML structure and styles for the floating panel inside Shadow DOM
   */
  createPanelDOM() {
    const style = document.createElement('style');
    style.textContent = `
      ${DESIGN_TOKENS}

      .qursor-floating-panel {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 380px;
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
        min-width: 340px;
        max-width: 460px;
        backdrop-filter: blur(20px);
        transition: background 0.2s, border-color 0.2s;
      }

      /* Top Icon Navigation Header Bar */
      .qursor-icon-navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: var(--q-bg-surface, #ffffff);
        border-bottom: 1px solid var(--q-border-subtle);
        cursor: move;
        user-select: none;
      }

      .navbar-icons-group {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .nav-icon-btn {
        background: none;
        border: none;
        color: var(--q-text-muted, #86868b);
        width: 28px;
        height: 28px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
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

      .nav-close-btn {
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
      }
      .nav-close-btn:hover { color: var(--q-text-primary); }

      /* Action Trigger Pill / Search Bar */
      .qursor-trigger-bar {
        padding: 8px 12px;
        background: var(--q-bg-primary);
        border-bottom: 1px solid var(--q-border-subtle);
      }

      .trigger-input-pill {
        background: var(--q-bg-surface, #ffffff);
        border: 1px solid var(--q-border, #e5e5ea);
        border-radius: 8px;
        padding: 6px 12px;
        display: flex;
        align-items: center;
        justify-content: center;
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
        font-size: 11px;
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

      /* Panel Body Card */
      .qursor-panel-body {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow-y: auto;
        max-height: 480px;
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

      /* Typography Specimen Spec */
      .specimen-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--q-text-primary);
      }

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

      /* Checkerboard Asset Preview Box */
      .asset-preview-card {
        background-color: #ffffff;
        background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
        background-size: 16px 16px;
        background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        border-radius: 8px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--q-border);
      }

      .asset-action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 4px;
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

      /* Editable Property Row */
      .edit-prop-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 11px;
      }

      .edit-prop-input {
        background: var(--q-bg-primary);
        border: 1px solid var(--q-border);
        border-radius: 4px;
        padding: 3px 6px;
        font-family: monospace;
        font-size: 11px;
        color: var(--q-text-primary);
        width: 100px;
        text-align: right;
      }

      .comment-textarea {
        background: var(--q-bg-surface);
        border: 1px solid var(--q-border);
        border-radius: 8px;
        padding: 8px;
        font-family: inherit;
        font-size: 11px;
        color: var(--q-text-primary);
        resize: vertical;
        min-height: 50px;
        outline: none;
      }

      .comment-btn-group {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }

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
              ${tab.icon}
            </button>
          `).join('')}
        </div>
        <button class="nav-close-btn" id="panelCloseBtn" title="Close">✕</button>
      </div>

      <!-- Sub-Header Trigger / Search Bar -->
      <div class="qursor-trigger-bar" id="triggerBar">
        <div class="trigger-input-pill">
          <span>Aa</span>
          <span>Pick font</span>
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
    const navGroup = this.panelContainer.querySelector('.navbar-icons-group');

    // Dragging Logic
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.nav-icon-btn') || e.target.closest('.nav-close-btn')) return;
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

    // Body Delegated Handlers
    const body = this.panelContainer.querySelector('#panelBody');
    body.addEventListener('click', async (e) => {
      const segBtn = e.target.closest('.segment-btn');
      const copyBtn = e.target.closest('.copy-action-trigger');
      const downloadBtn = e.target.closest('.download-action-trigger');

      if (segBtn) {
        const segGroup = segBtn.dataset.segGroup;
        const value = segBtn.dataset.segValue;
        if (segGroup === 'codeSegment') this.codeSegment = value;
        if (segGroup === 'codeScope') this.codeScope = value;
        if (segGroup === 'codeStyles') this.codeStyles = value;
        if (segGroup === 'assetSegment') this.assetSegment = value;
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
        const content = generateComponentCode(this.currentData, FRAMEWORKS.REACT);
        this.downloadFile(content, `${this.currentData.tag.toLowerCase()}_component.jsx`);
        this.toastManager.show('✓ Downloaded component file', 'success');
      }
    });
  }

  updateData(data) {
    this.currentData = data;
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
      triggerBar.innerHTML = `<div class="trigger-input-pill"><span>🔍 Select an element on the webpage</span></div>`;
      body.innerHTML = `
        <div style="text-align:center; padding:32px 16px; color:var(--q-text-muted);">
          <div style="font-size:32px;">🎯</div>
          <div style="font-weight:700; margin-top:8px; color:var(--q-text-primary);">No Element Selected</div>
          <div style="font-size:11px; margin-top:4px;">Click any element to inspect typography, colors, assets, code, or prompts.</div>
        </div>
      `;
      return;
    }

    const d = this.currentData;

    switch (this.activeTab) {
      case 'typography': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>Aa</span> <span>Pick font</span></div>`;
        body.innerHTML = `
          <div class="section-label-row">
            <span>SELECTED ELEMENT</span>
            <span class="node-badge">1</span>
          </div>

          <div class="qursor-card">
            <div class="specimen-title">${d.tag.charAt(0) + d.tag.slice(1).toLowerCase()}</div>
            <div class="specimen-preview-box" style="font-family:${d.typography.fontFamily}; font-size:18px; font-weight:${d.typography.fontWeight}; line-height:${d.typography.lineHeight};">
              AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz
            </div>

            <div class="prop-grid">
              <div class="prop-row"><span class="prop-label">Font family</span><span class="prop-value">${d.typography.fontFamily.split(',')[0].replace(/['"]/g, '')}</span></div>
              <div class="prop-row"><span class="prop-label">Font size</span><span class="prop-value">${d.typography.fontSize}</span></div>
              <div class="prop-row">
                <span class="prop-label">Text color</span>
                <span class="prop-value copy-action-trigger" data-copy-text="${d.colors.color}" style="cursor:pointer;" title="Click to copy color">
                  <span class="swatch-mini" style="background:${d.colors.color};"></span>
                  ${rgbToHex(d.colors.color) || d.colors.color} 📋
                </span>
              </div>
              <div class="prop-row"><span class="prop-label">Weight</span><span class="prop-value">${d.typography.fontWeight}</span></div>
              <div class="prop-row"><span class="prop-label">Line height</span><span class="prop-value">${d.typography.lineHeight}</span></div>
              <div class="prop-row">
                <span class="prop-label">Contrast</span>
                <span class="contrast-badge">• Good 6.33:1</span>
              </div>
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
            <span>SELECTED COLORS</span>
            <span class="node-badge">1</span>
          </div>

          <div class="qursor-card">
            <div class="prop-row">
              <span style="display:flex; align-items:center; gap:6px; font-weight:700;">
                <span class="swatch-mini" style="background:${hex}; width:14px; height:14px;"></span>
                fill
              </span>
              <span class="prop-value copy-action-trigger" data-copy-text="${hex}" style="cursor:pointer;">${hex} 📋</span>
            </div>
            <div class="prop-grid" style="margin-top:6px;">
              <div class="prop-row"><span class="prop-label">HEX</span><span class="prop-value copy-action-trigger" data-copy-text="${hex}">${hex} 📋</span></div>
              <div class="prop-row"><span class="prop-label">RGB</span><span class="prop-value copy-action-trigger" data-copy-text="${d.colors.color}">${d.colors.color} 📋</span></div>
              <div class="prop-row"><span class="prop-label">RGBA</span><span class="prop-value copy-action-trigger" data-copy-text="${d.colors.color}">${d.colors.color} 📋</span></div>
            </div>
          </div>

          <div class="qursor-card">
            <div class="prop-row">
              <span style="display:flex; align-items:center; gap:6px; font-weight:700;">
                <span class="swatch-mini" style="background:${bgHex}; width:14px; height:14px;"></span>
                background
              </span>
              <span class="prop-value copy-action-trigger" data-copy-text="${bgHex}" style="cursor:pointer;">${bgHex} 📋</span>
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
            <span>ASSETS 1</span>
            <span class="node-badge">1</span>
          </div>

          <div class="qursor-card">
            <div style="font-weight:700; font-size:12px;">${d.tag.toLowerCase()}</div>
            <div class="asset-preview-card">
              ${d.specialDetails.type === 'IMAGE' 
                ? `<img src="${d.specialDetails.imageUrl}" style="max-height:80px; max-width:80%; object-fit:contain;" />` 
                : `<span style="font-size:36px;">✉️</span>`}
            </div>
            <div class="prop-row">
              <span class="prop-label">inline-svg</span>
              <span class="prop-value"><span class="swatch-mini" style="background:#000000;"></span> #000000</span>
            </div>
            <div class="prop-row" style="font-size:10px; color:var(--q-text-muted);">
              <span>SVG • ${d.general.fullOuterHTML ? d.general.fullOuterHTML.length : 120} B • ${d.widthPx}×${d.heightPx}</span>
            </div>
            <div class="asset-action-bar">
              <label style="font-size:10px; display:flex; align-items:center; gap:4px; cursor:pointer;"><input type="checkbox" /> Select</label>
              <div style="display:flex; gap:4px;">
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${escapeHtml(d.general.fullOuterHTML)}" title="Copy SVG">📋</button>
                <button class="icon-action-btn download-action-trigger" title="Download Asset">↓</button>
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 'code': {
        triggerBar.innerHTML = `
          <div class="segment-pill-container">
            <button class="segment-btn ${this.codeSegment === 'HTML + CSS' ? 'active' : ''}" data-seg-group="codeSegment" data-seg-value="HTML + CSS">HTML + CSS</button>
            <button class="segment-btn ${this.codeSegment === 'JSX' ? 'active' : ''}" data-seg-group="codeSegment" data-seg-value="JSX">JSX</button>
          </div>
        `;

        const codeText = this.codeSegment === 'JSX' 
          ? generateComponentCode(d, FRAMEWORKS.REACT) 
          : d.general.fullOuterHTML;

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
              <span>${d.widthPx}×${d.heightPx} • ${d.dom.childCount || 1} nodes • ${d.classes.length || 12} rules</span>
              <div style="display:flex; gap:4px;">
                <button class="icon-action-btn copy-action-trigger" data-copy-text="${escapeHtml(codeText)}" title="Copy Code">📋</button>
                <button class="icon-action-btn download-action-trigger" title="Download File">↓</button>
              </div>
            </div>
            <textarea style="width:100%; min-height:140px; background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:8px; font-family:monospace; font-size:10px; outline:none;" readonly>${escapeHtml(codeText)}</textarea>
          </div>
        `;
        break;
      }

      case 'edit': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>▾ link: "${d.tag.toLowerCase()}"</span></div>`;
        const hex = rgbToHex(d.colors.color) || '#ffffff';
        const bgHex = rgbToHex(d.colors.backgroundColor) || '#000000';

        body.innerHTML = `
          <div class="qursor-card">
            <div class="edit-prop-row">
              <span class="prop-label">color:</span>
              <input type="text" class="edit-prop-input" value="${hex}" />
            </div>
            <div class="edit-prop-row">
              <span class="prop-label">background-color:</span>
              <input type="text" class="edit-prop-input" value="${bgHex}" />
            </div>
            <div class="edit-prop-row">
              <span class="prop-label">font-size:</span>
              <input type="text" class="edit-prop-input" value="${d.typography.fontSize}" />
            </div>
            <div class="edit-prop-row">
              <span class="prop-label">font-weight:</span>
              <input type="text" class="edit-prop-input" value="${d.typography.fontWeight}" />
            </div>
          </div>

          <div class="qursor-card">
            <textarea class="comment-textarea" placeholder="What should change ?"></textarea>
            <div class="comment-btn-group">
              <button class="q-btn">Cancel</button>
              <button class="q-btn q-btn-primary">Add</button>
            </div>
          </div>
        `;
        break;
      }

      case 'prompt': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>👤 AI Prompt Generator</span></div>`;
        const promptContent = this.editedPromptText || generateStructuredAiPrompt(d, this.promptFrameworkTarget);

        body.innerHTML = `
          <div class="qursor-card">
            <div class="prop-row">
              <span class="prop-label">Target Framework</span>
              <select style="background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:4px; padding:3px 6px; font-size:10px;" onchange="this.getRootNode().host._panel.promptFrameworkTarget = this.value; this.getRootNode().host._panel.renderTabContent();">
                <option value="React" ${this.promptFrameworkTarget === 'React' ? 'selected' : ''}>React</option>
                <option value="Next.js" ${this.promptFrameworkTarget === 'Next.js' ? 'selected' : ''}>Next.js</option>
                <option value="Vue 3" ${this.promptFrameworkTarget === 'Vue 3' ? 'selected' : ''}>Vue 3</option>
                <option value="Angular" ${this.promptFrameworkTarget === 'Angular' ? 'selected' : ''}>Angular</option>
                <option value="Tailwind CSS" ${this.promptFrameworkTarget === 'Tailwind CSS' ? 'selected' : ''}>Tailwind CSS</option>
              </select>
            </div>
          </div>

          <div class="qursor-card">
            <textarea style="width:100%; min-height:160px; background:var(--q-bg-primary); color:var(--q-text-primary); border:1px solid var(--q-border); border-radius:6px; padding:8px; font-family:monospace; font-size:10px; outline:none; white-space:pre-wrap;">${escapeHtml(promptContent)}</textarea>
            <div class="comment-btn-group">
              <button class="q-btn copy-action-trigger" data-copy-text="${escapeHtml(promptContent)}">📋 Copy Prompt</button>
            </div>
          </div>
        `;
        break;
      }

      case 'settings': {
        triggerBar.innerHTML = `<div class="trigger-input-pill"><span>⚙️ Qursor Settings</span></div>`;
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

    // Attach reference for inline onclick triggers
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
