/**
 * Qursor++ - Floating Information Panel UI
 * 
 * Production-grade, movable, resizable, collapsible developer tool floating panel.
 * Built with CSS Design Tokens (Dark/Light mode support), Shadow DOM isolation,
 * 12 developer-focused data tabs, multi-framework code generator, AI prompt generator,
 * and toast notification feedback.
 */

import { PANEL_TABS } from '../utils/constants.js';
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
    this.activeTab = 'overview';
    this.selectedFramework = FRAMEWORKS.REACT;
    this.promptFrameworkTarget = 'React';
    this.editedPromptText = null;
    this.isCollapsed = false;
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

      .inspector-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 520px;
        height: 600px;
        background: var(--q-bg-primary, #0f172a);
        color: var(--q-text-primary, #f8fafc);
        border: 1px solid var(--q-border, #334155);
        border-radius: 12px;
        box-shadow: var(--q-shadow-panel);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        z-index: 2147483647;
        overflow: hidden;
        pointer-events: auto !important;
        resize: both;
        min-width: 360px;
        min-height: 280px;
        backdrop-filter: blur(16px);
        transition: background 0.2s, border-color 0.2s;
      }

      .inspector-panel.collapsed {
        height: 44px !important;
        min-height: 44px !important;
        resize: none;
      }

      .inspector-panel.collapsed .panel-tabs,
      .inspector-panel.collapsed .panel-body,
      .inspector-panel.collapsed .panel-toolbar {
        display: none !important;
      }

      /* Header */
      .panel-header {
        background: var(--q-bg-surface, #1e293b);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--q-border, #334155);
        cursor: move;
        user-select: none;
      }

      .panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 13px;
        color: var(--q-text-accent, #38bdf8);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .panel-btn {
        background: var(--q-bg-surface-elevated, #334155);
        color: var(--q-text-secondary, #cbd5e1);
        border: 1px solid var(--q-border, #334155);
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 13px;
        font-weight: bold;
        transition: all 0.15s;
      }

      .panel-btn:hover {
        background: var(--q-accent, #38bdf8);
        color: #0f172a;
        border-color: var(--q-accent, #38bdf8);
      }

      /* Tabs Navigation */
      .panel-tabs {
        display: flex;
        background: var(--q-bg-primary, #0f172a);
        border-bottom: 1px solid var(--q-border, #334155);
        overflow-x: auto;
        user-select: none;
      }

      .panel-tabs::-webkit-scrollbar {
        height: 3px;
      }
      .panel-tabs::-webkit-scrollbar-thumb {
        background: var(--q-border, #334155);
        border-radius: 2px;
      }

      .tab-btn {
        padding: 8px 10px;
        background: none;
        border: none;
        color: var(--q-text-muted, #94a3b8);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        border-bottom: 2px solid transparent;
        transition: all 0.15s;
      }

      .tab-btn:hover { 
        color: var(--q-text-primary, #f8fafc); 
        background: var(--q-bg-hover);
      }
      .tab-btn.active {
        color: var(--q-text-accent, #38bdf8);
        border-bottom-color: var(--q-text-accent, #38bdf8);
        background: var(--q-accent-bg, rgba(56, 189, 248, 0.12));
      }

      /* Body Content */
      .panel-body {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        user-select: text;
      }

      .panel-body::-webkit-scrollbar {
        width: 6px;
      }
      .panel-body::-webkit-scrollbar-track {
        background: var(--q-bg-primary);
      }
      .panel-body::-webkit-scrollbar-thumb {
        background: var(--q-border);
        border-radius: 3px;
      }

      .data-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 7px 10px;
        background: var(--q-bg-surface, #1e293b);
        border-radius: 6px;
        border: 1px solid var(--q-border-subtle);
        gap: 12px;
      }

      .data-label {
        color: var(--q-text-muted, #94a3b8);
        font-weight: 600;
        font-size: 11px;
        min-width: 110px;
      }

      .data-value {
        color: var(--q-text-primary, #f8fafc);
        font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 11px;
        word-break: break-all;
        text-align: right;
        max-width: 70%;
        user-select: text;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
      }

      .color-swatch {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        border: 1px solid rgba(255,255,255,0.2);
        display: inline-block;
      }

      /* Editor & Code Blocks */
      .editor-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 100%;
      }

      .editor-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--q-bg-surface);
        padding: 6px 10px;
        border-radius: 6px;
        border: 1px solid var(--q-border);
      }

      .framework-select {
        background: var(--q-bg-primary);
        color: var(--q-text-primary);
        border: 1px solid var(--q-border);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
      }

      .code-editor {
        background: var(--q-code-bg, #090d16);
        color: var(--q-code-text, #e2e8f0);
        border: 1px solid var(--q-border, #334155);
        border-radius: 8px;
        padding: 12px;
        font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 11px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
        flex: 1;
        min-height: 280px;
        max-height: 380px;
        overflow-y: auto;
        outline: none;
        resize: vertical;
      }

      /* Spacing Diagram */
      .spacing-diagram {
        background: var(--q-bg-surface);
        border: 1px solid var(--q-border);
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: monospace;
        font-size: 11px;
      }

      .margin-box {
        border: 1px dashed #f59e0b;
        background: rgba(245, 158, 11, 0.08);
        padding: 12px;
        border-radius: 6px;
        width: 80%;
        text-align: center;
      }

      .padding-box {
        border: 1px dashed #38bdf8;
        background: rgba(56, 189, 248, 0.08);
        padding: 12px;
        border-radius: 4px;
        text-align: center;
      }

      .element-box {
        border: 1px solid #10b981;
        background: rgba(16, 185, 129, 0.15);
        padding: 8px;
        border-radius: 3px;
        color: #10b981;
        font-weight: bold;
      }

      /* Action Toolbar */
      .panel-toolbar {
        padding: 8px 10px;
        background: var(--q-bg-surface, #1e293b);
        border-top: 1px solid var(--q-border, #334155);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        justify-content: space-between;
      }

      .toolbar-left, .toolbar-right {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .copy-btn {
        background: var(--q-bg-surface-elevated, #334155);
        color: var(--q-text-primary, #f8fafc);
        border: 1px solid var(--q-border, #475569);
        border-radius: 6px;
        padding: 5px 9px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s;
      }

      .copy-btn:hover {
        background: var(--q-accent, #38bdf8);
        color: #0f172a;
        border-color: var(--q-accent, #38bdf8);
      }

      .copy-btn-primary {
        background: var(--q-accent, #38bdf8);
        color: #0f172a;
        border-color: var(--q-accent, #38bdf8);
      }
      .copy-btn-primary:hover {
        background: var(--q-accent-hover, #0284c7);
        color: #ffffff;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--q-text-muted);
        gap: 12px;
        text-align: center;
        padding: 32px 16px;
      }
    `;

    this.shadowRoot.appendChild(style);

    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'inspector-panel';
    this.panelContainer.setAttribute('data-theme', THEMES.DARK);

    this.panelContainer.innerHTML = `
      <!-- Header -->
      <div class="panel-header" id="panelHeader">
        <div class="panel-title">
          <span>⚡ Qursor++ AI</span>
          <span id="panelTagBadge" style="font-size: 10px; background: var(--q-bg-primary); color: var(--q-text-accent); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--q-border);">SELECT AN ELEMENT</span>
        </div>
        <div class="header-actions">
          <button class="panel-btn" id="themeToggleBtn" title="Toggle Light/Dark Theme">🌙</button>
          <button class="panel-btn" id="panelCollapseBtn" title="Minimize / Expand Panel">_</button>
          <button class="panel-btn" id="panelCloseBtn" title="Close Panel">✕</button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="panel-tabs" id="panelTabs">
        ${PANEL_TABS.map(tab => `
          <button class="tab-btn ${tab.id === this.activeTab ? 'active' : ''}" data-tab="${tab.id}">
            <span>${tab.icon}</span>
            <span>${tab.label}</span>
          </button>
        `).join('')}
      </div>

      <!-- Body Content -->
      <div class="panel-body" id="panelBody">
        <div class="empty-state">
          <span style="font-size: 32px;">🎯</span>
          <div>
            <div style="font-weight: 700; color: var(--q-text-primary); font-size: 13px;">No Element Selected</div>
            <div style="font-size: 11px; margin-top: 4px;">Click any element on the webpage to inspect telemetry, styles, component code, and AI prompts.</div>
          </div>
        </div>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="panel-toolbar" id="panelToolbar">
        <div class="toolbar-left">
          <button class="copy-btn" data-action="copy-selector">📋 Selector</button>
          <button class="copy-btn" data-action="copy-xpath">📍 XPath</button>
          <button class="copy-btn" data-action="copy-html">〈/〉 HTML</button>
          <button class="copy-btn" data-action="copy-css">🎨 CSS</button>
        </div>
        <div class="toolbar-right">
          <button class="copy-btn copy-btn-primary" data-action="copy-component">⚛️ Component</button>
          <button class="copy-btn copy-btn-primary" data-action="generate-prompt">✨ AI Prompt</button>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(this.panelContainer);
    this.themeManager.init();
    this.setupEventListeners();
  }

  /**
   * Sets up drag handles, tabs switching, copy actions, and theme toggling
   */
  setupEventListeners() {
    const header = this.panelContainer.querySelector('#panelHeader');
    const collapseBtn = this.panelContainer.querySelector('#panelCollapseBtn');
    const closeBtn = this.panelContainer.querySelector('#panelCloseBtn');
    const themeToggleBtn = this.panelContainer.querySelector('#themeToggleBtn');
    const tabsContainer = this.panelContainer.querySelector('#panelTabs');
    const toolbar = this.panelContainer.querySelector('#panelToolbar');

    // Dragging Logic
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.panel-btn')) return;
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

    // Theme Toggle
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newTheme = this.themeManager.toggleTheme();
      themeToggleBtn.textContent = newTheme === THEMES.DARK ? '🌙' : '☀️';
      this.toastManager.show(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
    });

    // Collapse Panel
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isCollapsed = !this.isCollapsed;
      this.panelContainer.classList.toggle('collapsed', this.isCollapsed);
      collapseBtn.textContent = this.isCollapsed ? '▢' : '_';
    });

    // Close Panel
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      if (this.onClose) this.onClose();
    });

    // Tabs Navigation Switch
    tabsContainer.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.tab-btn');
      if (!tabBtn) return;
      e.stopPropagation();

      const tabId = tabBtn.dataset.tab;
      this.activeTab = tabId;

      tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });

      this.renderTabContent();
    });

    // Quick Copy Actions in Toolbar
    toolbar.addEventListener('click', async (e) => {
      const btn = e.target.closest('.copy-btn');
      if (!btn || !this.currentData) return;
      e.stopPropagation();

      const action = btn.dataset.action;
      let textToCopy = '';
      let toastMsg = '';

      if (action === 'copy-selector') {
        textToCopy = this.currentData.selector || '';
        toastMsg = 'CSS Selector copied!';
      } else if (action === 'copy-xpath') {
        textToCopy = this.currentData.xpath || '';
        toastMsg = 'XPath copied!';
      } else if (action === 'copy-html') {
        textToCopy = this.currentData.general.fullOuterHTML || '';
        toastMsg = 'HTML Outer Snippet copied!';
      } else if (action === 'copy-css') {
        textToCopy = this.currentData.rawCss || '';
        toastMsg = 'Computed CSS rules copied!';
      } else if (action === 'copy-component') {
        textToCopy = generateComponentCode(this.currentData, this.selectedFramework);
        toastMsg = `${this.selectedFramework.toUpperCase()} Component code copied!`;
      } else if (action === 'generate-prompt') {
        this.activeTab = 'prompt';
        this.updateTabButtons();
        this.renderTabContent();
        toastMsg = 'AI Prompt generated!';
      }

      if (textToCopy) {
        await copyToClipboard(textToCopy);
        this.toastManager.show(toastMsg, 'success');
      }
    });

    // Interactive Delegated Handlers for Dynamic Content inside Panel Body
    const body = this.panelContainer.querySelector('#panelBody');
    body.addEventListener('change', (e) => {
      if (e.target.classList.contains('framework-select')) {
        this.selectedFramework = e.target.value;
        this.renderTabContent();
      } else if (e.target.classList.contains('prompt-target-select')) {
        this.promptFrameworkTarget = e.target.value;
        this.editedPromptText = null;
        this.renderTabContent();
      }
    });

    body.addEventListener('input', (e) => {
      if (e.target.classList.contains('prompt-editor-textarea')) {
        this.editedPromptText = e.target.value;
      }
    });

    body.addEventListener('click', async (e) => {
      const copyBtn = e.target.closest('.editor-copy-btn');
      const downloadBtn = e.target.closest('.editor-download-btn');
      const regenBtn = e.target.closest('.editor-regen-btn');

      if (copyBtn && this.currentData) {
        const type = copyBtn.dataset.copyType;
        const text = type === 'prompt' 
          ? (this.editedPromptText || generateStructuredAiPrompt(this.currentData, this.promptFrameworkTarget))
          : generateComponentCode(this.currentData, this.selectedFramework);

        await copyToClipboard(text);
        this.toastManager.show(`✓ Copied to clipboard!`, 'success');
      }

      if (downloadBtn && this.currentData) {
        const type = downloadBtn.dataset.downloadType;
        const isPrompt = type === 'prompt';
        const content = isPrompt 
          ? (this.editedPromptText || generateStructuredAiPrompt(this.currentData, this.promptFrameworkTarget))
          : generateComponentCode(this.currentData, this.selectedFramework);
        
        const ext = isPrompt ? 'md' : (this.selectedFramework === FRAMEWORKS.REACT ? 'jsx' : (this.selectedFramework === FRAMEWORKS.VUE ? 'vue' : 'html'));
        const filename = `${this.currentData.tag.toLowerCase()}_component.${ext}`;

        this.downloadFile(content, filename);
        this.toastManager.show(`✓ Downloaded ${filename}`, 'success');
      }

      if (regenBtn) {
        this.editedPromptText = null;
        this.renderTabContent();
        this.toastManager.show(`Regenerated AI Prompt!`, 'info');
      }
    });
  }

  updateTabButtons() {
    const tabsContainer = this.panelContainer.querySelector('#panelTabs');
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
    });
  }

  /**
   * Updates panel payload with newly inspected element telemetry
   * @param {Object} data 
   */
  updateData(data) {
    this.currentData = data;
    this.editedPromptText = null;
    if (!data) return;

    const badge = this.panelContainer.querySelector('#panelTagBadge');
    if (badge) {
      badge.textContent = `<${data.tag}> ${data.widthPx}×${data.heightPx}px`;
    }

    this.show();
    this.renderTabContent();
  }

  /**
   * Renders tab content body depending on currently active tab
   */
  renderTabContent() {
    const body = this.panelContainer.querySelector('#panelBody');
    if (!body) return;

    if (!this.currentData) {
      body.innerHTML = `
        <div class="empty-state">
          <span style="font-size: 32px;">🎯</span>
          <div>
            <div style="font-weight: 700; color: var(--q-text-primary); font-size: 13px;">No Element Selected</div>
            <div style="font-size: 11px; margin-top: 4px;">Click any element on the webpage to inspect telemetry, styles, component code, and AI prompts.</div>
          </div>
        </div>
      `;
      return;
    }

    const d = this.currentData;

    switch (this.activeTab) {
      case 'overview': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">Tag Name</span><span class="data-value">&lt;${d.general.tagName}&gt;</span></div>
          <div class="data-row"><span class="data-label">Element ID</span><span class="data-value">${d.general.id}</span></div>
          <div class="data-row"><span class="data-label">CSS Classes</span><span class="data-value">${d.classes.length ? d.classes.join(', ') : 'None'}</span></div>
          <div class="data-row"><span class="data-label">ARAI Role</span><span class="data-value">${d.general.role}</span></div>
          <div class="data-row"><span class="data-label">Accessible Name</span><span class="data-value">${d.general.accessibleName || 'N/A'}</span></div>
          <div class="data-row"><span class="data-label">Text Content</span><span class="data-value">${d.general.textContent || 'None'}</span></div>
          <div class="data-row"><span class="data-label">Value / Input</span><span class="data-value">${d.general.value}</span></div>
          <div class="data-row"><span class="data-label">Tab Index</span><span class="data-value">${d.general.tabIndex}</span></div>
          <div class="data-row"><span class="data-label">Disabled State</span><span class="data-value">${d.general.disabled ? 'Yes' : 'No'}</span></div>
          <div class="data-row"><span class="data-label">Visibility</span><span class="data-value">${d.general.hidden ? 'Hidden' : 'Visible'}</span></div>
        `;
        break;
      }

      case 'styles': {
        body.innerHTML = `
          <div style="font-size:11px; font-weight:700; color:var(--q-text-accent); margin-bottom:4px;">Computed CSS Rules</div>
          <div class="code-editor" style="min-height:300px;">${escapeHtml(d.rawCss || '/* No rules extracted */')}</div>
        `;
        break;
      }

      case 'layout': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">Dimensions</span><span class="data-value">${d.widthPx}px × ${d.heightPx}px</span></div>
          <div class="data-row"><span class="data-label">Display</span><span class="data-value">${d.layout.display}</span></div>
          <div class="data-row"><span class="data-label">Position</span><span class="data-value">${d.layout.position}</span></div>
          <div class="data-row"><span class="data-label">Top / Left</span><span class="data-value">${d.layout.top} / ${d.layout.left}</span></div>
          <div class="data-row"><span class="data-label">Right / Bottom</span><span class="data-value">${d.layout.right} / ${d.layout.bottom}</span></div>
          <div class="data-row"><span class="data-label">Z-Index</span><span class="data-value">${d.layout.zIndex}</span></div>
          <div class="data-row"><span class="data-label">Overflow</span><span class="data-value">${d.layout.overflow}</span></div>
        `;
        break;
      }

      case 'typography': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">Font Family</span><span class="data-value">${d.typography.fontFamily}</span></div>
          <div class="data-row"><span class="data-label">Font Size</span><span class="data-value">${d.typography.fontSize}</span></div>
          <div class="data-row"><span class="data-label">Font Weight</span><span class="data-value">${d.typography.fontWeight}</span></div>
          <div class="data-row"><span class="data-label">Line Height</span><span class="data-value">${d.typography.lineHeight}</span></div>
          <div class="data-row"><span class="data-label">Letter Spacing</span><span class="data-value">${d.typography.letterSpacing}</span></div>
          <div class="data-row"><span class="data-label">Text Align</span><span class="data-value">${d.typography.textAlign}</span></div>
          <div class="data-row"><span class="data-label">Text Transform</span><span class="data-value">${d.typography.textTransform}</span></div>
        `;
        break;
      }

      case 'colors': {
        body.innerHTML = `
          <div class="data-row">
            <span class="data-label">Text Color</span>
            <span class="data-value"><span class="color-swatch" style="background:${d.colors.color};"></span>${d.colors.color}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Background</span>
            <span class="data-value"><span class="color-swatch" style="background:${d.colors.backgroundColor};"></span>${d.colors.backgroundColor}</span>
          </div>
          <div class="data-row">
            <span class="data-label">Border Color</span>
            <span class="data-value"><span class="color-swatch" style="background:${d.border.borderColor};"></span>${d.border.borderColor}</span>
          </div>
          <div class="data-row"><span class="data-label">Box Shadow</span><span class="data-value">${d.colors.boxShadow}</span></div>
          <div class="data-row"><span class="data-label">Opacity</span><span class="data-value">${d.colors.opacity}</span></div>
        `;
        break;
      }

      case 'spacing': {
        body.innerHTML = `
          <div class="spacing-diagram">
            <div class="margin-box">
              <div>MARGIN: ${d.spacing.margin}</div>
              <div class="padding-box">
                <div>PADDING: ${d.spacing.padding}</div>
                <div class="element-box">&lt;${d.tag}&gt; ${d.widthPx}×${d.heightPx}</div>
              </div>
            </div>
          </div>
          <div class="data-row"><span class="data-label">Margin (TRBL)</span><span class="data-value">${d.spacing.margin}</span></div>
          <div class="data-row"><span class="data-label">Padding (TRBL)</span><span class="data-value">${d.spacing.padding}</span></div>
          <div class="data-row"><span class="data-label">Gap</span><span class="data-value">${d.flexGrid.gap || '0px'}</span></div>
        `;
        break;
      }

      case 'border': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">Border Width</span><span class="data-value">${d.border.borderWidth}</span></div>
          <div class="data-row"><span class="data-label">Border Style</span><span class="data-value">${d.border.borderStyle}</span></div>
          <div class="data-row">
            <span class="data-label">Border Color</span>
            <span class="data-value"><span class="color-swatch" style="background:${d.border.borderColor};"></span>${d.border.borderColor}</span>
          </div>
          <div class="data-row"><span class="data-label">Border Radius</span><span class="data-value">${d.border.borderRadius}</span></div>
        `;
        break;
      }

      case 'flex': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">Flex Direction</span><span class="data-value">${d.flexGrid.flexDirection}</span></div>
          <div class="data-row"><span class="data-label">Flex Wrap</span><span class="data-value">${d.flexGrid.flexWrap}</span></div>
          <div class="data-row"><span class="data-label">Justify Content</span><span class="data-value">${d.flexGrid.justifyContent}</span></div>
          <div class="data-row"><span class="data-label">Align Items</span><span class="data-value">${d.flexGrid.alignItems}</span></div>
          <div class="data-row"><span class="data-label">Gap</span><span class="data-value">${d.flexGrid.gap}</span></div>
          <div class="data-row"><span class="data-label">Grid Columns</span><span class="data-value">${d.flexGrid.gridTemplateColumns}</span></div>
          <div class="data-row"><span class="data-label">Grid Rows</span><span class="data-value">${d.flexGrid.gridTemplateRows}</span></div>
        `;
        break;
      }

      case 'dom': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">Parent Element</span><span class="data-value">&lt;${d.dom.parentTag || 'N/A'}&gt;</span></div>
          <div class="data-row"><span class="data-label">Child Count</span><span class="data-value">${d.dom.childCount}</span></div>
          <div class="data-row"><span class="data-label">DOM Tree Depth</span><span class="data-value">${d.dom.depth}</span></div>
          <div class="data-row"><span class="data-label">CSS Selector Path</span><span class="data-value">${d.selector}</span></div>
          <div class="data-row"><span class="data-label">XPath Location</span><span class="data-value">${d.xpath}</span></div>
        `;
        break;
      }

      case 'accessibility': {
        body.innerHTML = `
          <div class="data-row"><span class="data-label">WAI-ARIA Role</span><span class="data-value">${d.general.role}</span></div>
          <div class="data-row"><span class="data-label">Accessible Name</span><span class="data-value">${d.general.accessibleName || 'N/A'}</span></div>
          <div class="data-row"><span class="data-label">Tab Index</span><span class="data-value">${d.general.tabIndex}</span></div>
          <div class="data-row"><span class="data-label">Disabled</span><span class="data-value">${d.general.disabled ? 'True' : 'False'}</span></div>
          <div class="data-row"><span class="data-label">ARIA Attributes</span><span class="data-value">${Object.keys(d.general.ariaAttributes || {}).length ? JSON.stringify(d.general.ariaAttributes) : 'None'}</span></div>
        `;
        break;
      }

      case 'component': {
        const code = generateComponentCode(d, this.selectedFramework);
        body.innerHTML = `
          <div class="editor-container">
            <div class="editor-toolbar">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; font-weight:700; color:var(--q-text-accent);">Framework:</span>
                <select class="framework-select">
                  <option value="${FRAMEWORKS.REACT}" ${this.selectedFramework === FRAMEWORKS.REACT ? 'selected' : ''}>React (JSX)</option>
                  <option value="${FRAMEWORKS.VUE}" ${this.selectedFramework === FRAMEWORKS.VUE ? 'selected' : ''}>Vue 3 SFC</option>
                  <option value="${FRAMEWORKS.ANGULAR}" ${this.selectedFramework === FRAMEWORKS.ANGULAR ? 'selected' : ''}>Angular Component</option>
                  <option value="${FRAMEWORKS.TAILWIND}" ${this.selectedFramework === FRAMEWORKS.TAILWIND ? 'selected' : ''}>Tailwind CSS HTML</option>
                  <option value="${FRAMEWORKS.VANILLA}" ${this.selectedFramework === FRAMEWORKS.VANILLA ? 'selected' : ''}>Vanilla HTML/CSS/JS</option>
                  <option value="${FRAMEWORKS.HTML}" ${this.selectedFramework === FRAMEWORKS.HTML ? 'selected' : ''}>Clean HTML</option>
                  <option value="${FRAMEWORKS.CSS}" ${this.selectedFramework === FRAMEWORKS.CSS ? 'selected' : ''}>Computed CSS</option>
                </select>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="copy-btn editor-copy-btn" data-copy-type="component">📋 Copy Code</button>
                <button class="copy-btn editor-download-btn" data-download-type="component">💾 Download</button>
              </div>
            </div>
            <textarea class="code-editor" readonly>${escapeHtml(code)}</textarea>
          </div>
        `;
        break;
      }

      case 'prompt': {
        const promptContent = this.editedPromptText || generateStructuredAiPrompt(d, this.promptFrameworkTarget);
        body.innerHTML = `
          <div class="editor-container">
            <div class="editor-toolbar">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; font-weight:700; color:var(--q-text-accent);">Target Framework:</span>
                <select class="framework-select prompt-target-select">
                  <option value="React" ${this.promptFrameworkTarget === 'React' ? 'selected' : ''}>React</option>
                  <option value="Next.js" ${this.promptFrameworkTarget === 'Next.js' ? 'selected' : ''}>Next.js</option>
                  <option value="Vue 3" ${this.promptFrameworkTarget === 'Vue 3' ? 'selected' : ''}>Vue 3</option>
                  <option value="Angular" ${this.promptFrameworkTarget === 'Angular' ? 'selected' : ''}>Angular</option>
                  <option value="Tailwind CSS" ${this.promptFrameworkTarget === 'Tailwind CSS' ? 'selected' : ''}>Tailwind CSS</option>
                  <option value="HTML/CSS" ${this.promptFrameworkTarget === 'HTML/CSS' ? 'selected' : ''}>Vanilla HTML/CSS</option>
                </select>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="copy-btn editor-regen-btn" title="Reset and Regenerate Prompt">🔄 Reset</button>
                <button class="copy-btn editor-copy-btn" data-copy-type="prompt">📋 Copy Prompt</button>
                <button class="copy-btn editor-download-btn" data-download-type="prompt">💾 Download .md</button>
              </div>
            </div>
            <textarea class="code-editor prompt-editor-textarea" style="white-space:pre-wrap;">${escapeHtml(promptContent)}</textarea>
          </div>
        `;
        break;
      }
    }
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
