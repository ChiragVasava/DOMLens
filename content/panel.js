/**
 * DOMLens - Floating Information Panel UI
 * 
 * Production-grade, movable, resizable, collapsible dark-theme floating panel.
 * Rendered inside Shadow DOM for total isolation from page styles.
 */

import { PANEL_TABS } from '../utils/constants.js';
import { copyToClipboard } from '../utils/clipboard.js';

export class InspectorPanel {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.panelContainer = null;
    this.currentData = null;
    this.activeTab = 'preview';
    this.isCollapsed = false;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.onClose = null;

    this.createPanelDOM();
  }

  /**
   * Constructs the HTML structure and styles for the floating panel inside Shadow DOM
   */
  createPanelDOM() {
    const style = document.createElement('style');
    style.textContent = `
      .inspector-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 480px;
        height: 560px;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 12px;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        z-index: 2147483647;
        overflow: hidden;
        pointer-events: auto !important;
        resize: both;
        min-width: 340px;
        min-height: 240px;
        backdrop-filter: blur(16px);
      }

      .inspector-panel.collapsed {
        height: 48px !important;
        min-height: 48px !important;
        resize: none;
      }

      .inspector-panel.collapsed .panel-tabs,
      .inspector-panel.collapsed .panel-body,
      .inspector-panel.collapsed .panel-toolbar {
        display: none !important;
      }

      /* Header */
      .panel-header {
        background: #1e293b;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #334155;
        cursor: move;
        pointer-events: auto;
      }

      .panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 13px;
        color: #38bdf8;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .panel-btn {
        background: #334155;
        color: #cbd5e1;
        border: none;
        width: 26px;
        height: 26px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.2s;
        pointer-events: auto;
      }

      .panel-btn:hover {
        background: #38bdf8;
        color: #0f172a;
      }

      /* Tabs Navigation */
      .panel-tabs {
        display: flex;
        background: #0f172a;
        border-bottom: 1px solid #334155;
        overflow-x: auto;
        pointer-events: auto;
      }

      .panel-tabs::-webkit-scrollbar {
        height: 4px;
      }
      .panel-tabs::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 2px;
      }

      .tab-btn {
        padding: 10px 12px;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
        pointer-events: auto;
      }

      .tab-btn:hover { color: #f8fafc; background: rgba(255,255,255,0.03); }
      .tab-btn.active {
        color: #38bdf8;
        border-bottom-color: #38bdf8;
        background: rgba(56, 189, 248, 0.12);
      }

      /* Body Content */
      .panel-body {
        flex: 1;
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: auto;
        user-select: text;
      }

      .panel-body::-webkit-scrollbar {
        width: 6px;
      }
      .panel-body::-webkit-scrollbar-track {
        background: #0f172a;
      }
      .panel-body::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 3px;
      }
      .panel-body::-webkit-scrollbar-thumb:hover {
        background: #38bdf8;
      }

      .data-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 8px 10px;
        background: #1e293b;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.04);
        gap: 12px;
      }

      .data-label {
        color: #94a3b8;
        font-weight: 600;
        font-size: 11px;
        min-width: 110px;
      }

      .data-value {
        color: #f8fafc;
        font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 11px;
        word-break: break-all;
        text-align: right;
        max-width: 70%;
        user-select: text;
      }

      /* Code view block */
      .code-block {
        background: #090d16;
        border: 1px solid #334155;
        border-radius: 6px;
        padding: 12px;
        font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 11px;
        line-height: 1.5;
        color: #38bdf8;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 360px;
        overflow-y: auto;
        user-select: text;
        pointer-events: auto;
      }

      /* Action Copy Toolbar */
      .panel-toolbar {
        padding: 10px 12px;
        background: #1e293b;
        border-top: 1px solid #334155;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        pointer-events: auto;
      }

      .copy-btn {
        background: #334155;
        color: #f8fafc;
        border: 1px solid #475569;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        pointer-events: auto;
      }

      .copy-btn:hover {
        background: #38bdf8;
        color: #0f172a;
        border-color: #38bdf8;
      }

      /* Toast notification */
      .toast-msg {
        position: absolute;
        top: 55px;
        left: 50%;
        transform: translateX(-50%);
        background: #10b981;
        color: #0f172a;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 10;
      }

      .toast-msg.show { opacity: 1; }
    `;

    this.shadowRoot.appendChild(style);

    this.panelContainer = document.createElement('div');
    this.panelContainer.className = 'inspector-panel';
    this.panelContainer.style.display = 'none';

    this.panelContainer.innerHTML = `
      <div class="toast-msg" id="toastMsg">Copied to Clipboard!</div>
      
      <!-- Header -->
      <div class="panel-header" id="panelHeader">
        <div class="panel-title">
          <span>🔍 DOMLens AI</span>
          <span id="panelTagBadge" style="font-size: 10px; background: #334155; color: #38bdf8; padding: 2px 6px; border-radius: 4px;">SELECT AN ELEMENT</span>
        </div>
        <div class="header-actions">
          <button class="panel-btn" id="collapseBtn" title="Collapse/Expand">−</button>
          <button class="panel-btn" id="closeBtn" title="Close Panel">✕</button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="panel-tabs" id="tabNav">
        ${PANEL_TABS.map(tab => `
          <button class="tab-btn ${tab.id === 'preview' ? 'active' : ''}" data-tab="${tab.id}">
            <span>${tab.icon}</span> ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- Body Content -->
      <div class="panel-body" id="panelBody">
        <div class="data-row"><span class="data-label">Status</span><span class="data-value">Click any element to inspect</span></div>
      </div>

      <!-- Copy Action Toolbar -->
      <div class="panel-toolbar">
        <button class="copy-btn" data-copy="json">📋 JSON</button>
        <button class="copy-btn" data-copy="html">📋 HTML</button>
        <button class="copy-btn" data-copy="outerhtml">📋 OuterHTML</button>
        <button class="copy-btn" data-copy="selector">📋 Selector</button>
        <button class="copy-btn" data-copy="xpath">📋 XPath</button>
        <button class="copy-btn" data-copy="styles">📋 Styles</button>
      </div>
    `;

    this.shadowRoot.appendChild(this.panelContainer);
    this.attachEventListeners();
  }

  /**
   * Attaches panel drag, tab switching, and copy action listeners
   */
  attachEventListeners() {
    const header = this.panelContainer.querySelector('#panelHeader');
    const collapseBtn = this.panelContainer.querySelector('#collapseBtn');
    const closeBtn = this.panelContainer.querySelector('#closeBtn');
    const tabNav = this.panelContainer.querySelector('#tabNav');
    const toolbar = this.panelContainer.querySelector('.panel-toolbar');

    // Prevent clicks inside panel from triggering host page click actions
    this.panelContainer.addEventListener('mousedown', (e) => e.stopPropagation());
    this.panelContainer.addEventListener('click', (e) => e.stopPropagation());

    // Drag header functionality
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.panel-btn')) return;
      this.isDragging = true;
      const rect = this.panelContainer.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      let left = e.clientX - this.dragOffsetX;
      let top = e.clientY - this.dragOffsetY;
      
      // Boundary safety
      left = Math.max(0, Math.min(window.innerWidth - 100, left));
      top = Math.max(0, Math.min(window.innerHeight - 40, top));

      this.panelContainer.style.left = `${left}px`;
      this.panelContainer.style.top = `${top}px`;
      this.panelContainer.style.bottom = 'auto';
      this.panelContainer.style.right = 'auto';
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Collapse / Expand Button
    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isCollapsed = !this.isCollapsed;
      if (this.isCollapsed) {
        this.panelContainer.classList.add('collapsed');
        collapseBtn.textContent = '+';
      } else {
        this.panelContainer.classList.remove('collapsed');
        collapseBtn.textContent = '−';
      }
    });

    // Close Button
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Tab Navigation
    tabNav.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      const targetTab = btn.dataset.tab;
      
      tabNav.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeTab = targetTab;
      this.renderTabContent();
    });

    // Copy Actions
    toolbar.addEventListener('click', async (e) => {
      e.stopPropagation();
      const btn = e.target.closest('.copy-btn');
      if (!btn || !this.currentData) return;

      const type = btn.dataset.copy;
      let content = '';

      switch (type) {
        case 'json':
          content = JSON.stringify(this.currentData, null, 2);
          break;
        case 'html':
          content = (this.currentData.general.innerHTML || '').replace(/\s*class=(?:"[^"]*"|'[^']*'|\S+)/gi, '');
          break;
        case 'outerhtml':
          content = (this.currentData.general.fullOuterHTML || '').replace(/\s*class=(?:"[^"]*"|'[^']*'|\S+)/gi, '');
          break;
        case 'selector':
          content = this.currentData.selector;
          break;
        case 'xpath':
          content = this.currentData.xpath;
          break;
        case 'styles':
          content = this.currentData.rawCss;
          break;
      }

      const success = await copyToClipboard(content);
      if (success) {
        this.showToast(`Copied ${type.toUpperCase()}!`);
      }
    });
  }

  /**
   * Updates panel content with element analysis data
   * @param {Object} data 
   */
  updateData(data) {
    this.currentData = data;
    if (!data) return;

    const badge = this.panelContainer.querySelector('#panelTagBadge');
    badge.textContent = `${data.tag}${data.general.id !== 'N/A' ? '#' + data.general.id : ''}`;

    this.renderTabContent();
    this.panelContainer.style.display = 'flex';
  }

  /**
   * Renders active tab content view
   */
  renderTabContent() {
    if (!this.currentData) return;
    const body = this.panelContainer.querySelector('#panelBody');
    const d = this.currentData;

    let html = '';

    switch (this.activeTab) {
      case 'preview': {
        let renderableHtml = d.general.fullOuterHTML || '';
        const lowerTag = (d.general.tagName || '').toLowerCase();

        // Handle structural HTML elements requiring container tags to render accurately
        if (lowerTag === 'td' || lowerTag === 'th') {
          renderableHtml = `<table style="width:100%; border-collapse:collapse; background:transparent; table-layout:auto;"><tbody><tr>${renderableHtml}</tr></tbody></table>`;
        } else if (lowerTag === 'tr') {
          renderableHtml = `<table style="width:100%; border-collapse:collapse; background:transparent;"><tbody>${renderableHtml}</tbody></table>`;
        } else if (lowerTag === 'tbody' || lowerTag === 'thead' || lowerTag === 'tfoot') {
          renderableHtml = `<table style="width:100%; border-collapse:collapse; background:transparent;">${renderableHtml}</table>`;
        } else if (lowerTag === 'li') {
          renderableHtml = `<ul style="margin:0; padding-left:20px;">${renderableHtml}</ul>`;
        } else if (lowerTag === 'dt' || lowerTag === 'dd') {
          renderableHtml = `<dl style="margin:0;">${renderableHtml}</dl>`;
        }

        const parentClasses = (d.dom.parentClasses || []).join(' ');
        const formattedComputedCss = d.rawCss ? `.preview-wrapper > * {\n${d.rawCss}\n}` : '';

        const srcDoc = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <base href="${d.baseUrl || window.location.href}">
            ${d.pageStyles || ''}
            <style>
              * { box-sizing: border-box; }
              html, body {
                margin: 0 !important;
                padding: 16px !important;
                background: #0d1117 !important;
                color: #c9d1d9;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                min-height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
              }
              .preview-wrapper {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                display: block;
                overflow-x: auto !important;
              }
              .preview-wrapper table {
                width: 100% !important;
                max-width: 100% !important;
                table-layout: auto !important;
              }
              .preview-wrapper td, .preview-wrapper th {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
              }
              .preview-wrapper img, .preview-wrapper svg {
                max-width: 100% !important;
                height: auto;
              }
              ${formattedComputedCss}
            </style>
          </head>
          <body class="${parentClasses}">
            <div class="preview-wrapper ${parentClasses}">
              ${renderableHtml}
            </div>
          </body>
          </html>
        `.trim();

        const escapedSrcDoc = srcDoc
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        html = `
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; height: 100%;">
            <div style="font-size: 11px; color: #38bdf8; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
              <span>👁️ Phase 3 Component Live Preview</span>
              <span style="font-size: 10px; color: #94a3b8;">100% Fidelity HTML & CSS View</span>
            </div>
            <iframe style="width: 100%; height: 340px; border: 1px solid #334155; border-radius: 8px; background: #0d1117;" srcdoc="${escapedSrcDoc}"></iframe>
          </div>
        `;
        break;
      }

      case 'general':
        html = `
          ${this.renderRow('Tag Name', d.general.tagName)}
          ${this.renderRow('ID', d.general.id)}
          ${this.renderRow('Classes', d.classes.join(', ') || 'None')}
          ${this.renderRow('Text Content', d.general.textContent || 'None')}
          ${this.renderRow('Value', d.general.value)}
          ${this.renderRow('Role', d.general.role)}
          ${this.renderRow('Disabled', d.general.disabled ? 'Yes' : 'No')}
          ${this.renderRow('Required', d.general.required ? 'Yes' : 'No')}
          ${this.renderRow('Content Editable', d.general.isContentEditable ? 'Yes' : 'No')}
        `;
        break;

      case 'layout':
        html = Object.entries(d.layout)
          .map(([k, v]) => this.renderRow(k, v))
          .join('');
        break;

      case 'typography':
        html = Object.entries(d.typography)
          .map(([k, v]) => this.renderRow(k, v))
          .join('');
        break;

      case 'colors':
        html = Object.entries(d.colors)
          .map(([k, v]) => this.renderRow(k, v))
          .join('');
        break;

      case 'spacing':
        html = Object.entries(d.spacing)
          .map(([k, v]) => this.renderRow(k, v))
          .join('');
        break;

      case 'border':
        html = Object.entries(d.border)
          .map(([k, v]) => this.renderRow(k, v))
          .join('');
        break;

      case 'flex':
        html = Object.entries(d.flexGrid)
          .map(([k, v]) => this.renderRow(k, v))
          .join('');
        break;

      case 'dom':
        html = `
          ${this.renderRow('Parent Tag', d.dom.parentTag)}
          ${this.renderRow('Parent ID', d.dom.parentId || 'None')}
          ${this.renderRow('Children Count', d.dom.childrenCount)}
          ${this.renderRow('Child Tags', d.dom.childTags.join(', ') || 'None')}
          ${this.renderRow('Previous Sibling', d.dom.previousSiblingTag)}
          ${this.renderRow('Next Sibling', d.dom.nextSiblingTag)}
          ${this.renderRow('DOM Depth', d.dom.depth)}
          ${this.renderRow('CSS Selector', d.selector)}
          ${this.renderRow('XPath', d.xpath)}
        `;
        break;

      case 'attributes':
        html = Object.keys(d.attributes).length > 0
          ? Object.entries(d.attributes).map(([k, v]) => this.renderRow(k, v)).join('')
          : '<div class="data-row"><span class="data-label">Attributes</span><span class="data-value">No HTML attributes</span></div>';
        break;

      case 'html': {
        const cleanOuterHtml = (d.general.fullOuterHTML || '')
          .replace(/\s*class=(?:"[^"]*"|'[^']*'|\S+)/gi, '');
        html = `<div class="code-block">${this.escapeHtml(cleanOuterHtml)}</div>`;
        break;
      }

      case 'css':
        html = `<div class="code-block">${this.escapeHtml(d.rawCss)}</div>`;
        break;
    }

    body.innerHTML = html;
  }

  renderRow(label, value) {
    return `
      <div class="data-row">
        <span class="data-label">${label}</span>
        <span class="data-value">${value !== undefined && value !== null ? value : 'N/A'}</span>
      </div>
    `;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  showToast(msg) {
    const toast = this.shadowRoot.querySelector('#toastMsg');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  hide() {
    if (this.panelContainer) this.panelContainer.style.display = 'none';
    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  }
}
