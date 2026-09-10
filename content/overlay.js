/**
 * Qursor++ - Visual Overlay Engine (100% Qursor Replica)
 * 
 * Manages hover bounding box highlights, selection box with blue numbered badge '1',
 * and hover details inspector tooltip cards.
 */

import { OVERLAY_STYLES } from '../utils/constants.js';
import { DESIGN_TOKENS } from '../utils/theme.js';

export class InspectorOverlay {
  constructor() {
    this.hostElement = null;
    this.shadowRoot = null;
    this.hoverBox = null;
    this.selectedBox = null;
    this.selectedBadge = null;
    this.tooltip = null;
    this.activeElement = null;
    this.selectedElement = null;
    this.rafId = null;

    this.handleScrollResize = this.handleScrollResize.bind(this);
    window.addEventListener('scroll', this.handleScrollResize, { passive: true });
    window.addEventListener('resize', this.handleScrollResize, { passive: true });

    this.initShadowDom();
  }

  /**
   * Initializes host container and Shadow DOM
   */
  initShadowDom() {
    if (document.getElementById('website-inspector-root')) {
      this.hostElement = document.getElementById('website-inspector-root');
      this.shadowRoot = this.hostElement.shadowRoot;
    } else {
      this.hostElement = document.createElement('website-inspector-root');
      this.hostElement.id = 'website-inspector-root';
      this.hostElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
      this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });
      document.documentElement.appendChild(this.hostElement);
    }

    this.renderOverlayContainers();
  }

  /**
   * Renders overlay boxes inside Shadow DOM
   */
  renderOverlayContainers() {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      ${DESIGN_TOKENS}

      .inspector-box {
        position: fixed;
        pointer-events: none;
        box-sizing: border-box;
        transition: all 0.05s ease-out;
        z-index: ${OVERLAY_STYLES.Z_INDEX};
        border-radius: 4px;
      }

      .hover-box {
        border: var(--q-overlay-hover-border, 2px solid #2563eb);
        background: var(--q-overlay-hover-bg, rgba(37, 99, 235, 0.12));
        box-shadow: var(--q-overlay-hover-shadow);
      }

      .selected-box {
        position: absolute;
        border: var(--q-overlay-select-border, 2px solid #2563eb);
        background: var(--q-overlay-select-bg, rgba(37, 99, 235, 0.12));
        box-shadow: var(--q-overlay-select-shadow);
      }

      .selected-badge-num {
        position: absolute;
        top: -11px;
        right: -11px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #2563eb;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
        pointer-events: none;
        z-index: ${OVERLAY_STYLES.Z_INDEX + 2};
      }

      /* Qursor Hover Inspector Card */
      .inspector-tooltip-card {
        position: fixed;
        pointer-events: none;
        background: var(--q-bg-surface, #ffffff);
        color: var(--q-text-primary, #1d1d1f);
        border: 1px solid var(--q-border, #e5e5ea);
        border-radius: 12px;
        padding: 10px 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        z-index: ${OVERLAY_STYLES.Z_INDEX + 1};
        box-shadow: 0 10px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 170px;
      }

      .tooltip-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        font-size: 12px;
      }

      .tooltip-card-tag { color: var(--q-text-primary); font-weight: 700; }
      .tooltip-card-dim { color: var(--q-text-muted); font-size: 11px; font-weight: 500; }
      .tooltip-card-divider { height: 1px; background: var(--q-border, #e5e5ea); margin: 2px 0; }

      .tooltip-card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .tooltip-card-label { color: var(--q-text-muted); font-weight: 500; }
      .tooltip-card-pill {
        background: var(--q-bg-primary, #f5f5f7);
        border: 1px solid var(--q-border, #e5e5ea);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: SFMono-Regular, Consolas, monospace;
        font-size: 10px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .swatch-mini {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        border: 1px solid rgba(0,0,0,0.15);
        display: inline-block;
      }
    `;

    this.shadowRoot.appendChild(styleTag);

    // Hover Box
    this.hoverBox = document.createElement('div');
    this.hoverBox.className = 'inspector-box hover-box';
    this.hoverBox.style.display = 'none';
    this.shadowRoot.appendChild(this.hoverBox);

    // Selected Box
    this.selectedBox = document.createElement('div');
    this.selectedBox.className = 'inspector-box selected-box';
    this.selectedBox.style.display = 'none';

    // Numbered Badge '1'
    this.selectedBadge = document.createElement('div');
    this.selectedBadge.className = 'selected-badge-num';
    this.selectedBadge.textContent = '1';
    this.selectedBox.appendChild(this.selectedBadge);

    this.shadowRoot.appendChild(this.selectedBox);

    // Tooltip Card
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'inspector-tooltip-card';
    this.tooltip.style.display = 'none';
    this.shadowRoot.appendChild(this.tooltip);
  }

  handleScrollResize() {
    if (this.selectedElement && this.selectedBox && this.selectedBox.style.display !== 'none') {
      this.repositionSelectedBox();
    }
  }

  /**
   * Updates hover highlight box for a target element
   * @param {Element} element 
   */
  updateHover(element) {
    if (!element || element === this.hostElement) {
      this.hideHover();
      return;
    }

    this.activeElement = element;
    const rect = element.getBoundingClientRect();

    if (this.rafId) cancelAnimationFrame(this.rafId);

    this.rafId = requestAnimationFrame(() => {
      this.positionBox(this.hoverBox, rect);
      this.hoverBox.style.display = 'block';

      // Qursor Hover Inspector Card Data
      const tag = `<${element.tagName.toLowerCase()}>`;
      const dim = `${Math.round(rect.width)} × ${Math.round(rect.height)}px`;
      const cs = window.getComputedStyle(element);

      const textColorHex = rgbToHex(cs.color) || '#000000';
      const bgColorHex = rgbToHex(cs.backgroundColor) || '#FFFFFF';
      const fontStr = `${cs.fontFamily.split(',')[0].replace(/['"]/g, '')} ${cs.fontSize} / ${cs.fontWeight} / ${cs.lineHeight}`;
      const paddingStr = cs.padding !== '0px' ? cs.padding : '0px';
      const marginStr = cs.margin !== '0px' ? cs.margin : '0px';

      this.tooltip.innerHTML = `
        <div class="tooltip-card-header">
          <span class="tooltip-card-tag">${tag}</span>
          <span class="tooltip-card-dim">${dim}</span>
        </div>
        <div class="tooltip-card-divider"></div>
        <div class="tooltip-card-row">
          <span class="tooltip-card-label">Text</span>
          <span class="tooltip-card-pill"><span class="swatch-mini" style="background:${textColorHex};"></span>${textColorHex}</span>
        </div>
        <div class="tooltip-card-row">
          <span class="tooltip-card-label">Background</span>
          <span class="tooltip-card-pill"><span class="swatch-mini" style="background:${bgColorHex};"></span>${bgColorHex}</span>
        </div>
        <div class="tooltip-card-row">
          <span class="tooltip-card-label">Font</span>
          <span class="tooltip-card-pill">${fontStr}</span>
        </div>
        <div class="tooltip-card-row">
          <span class="tooltip-card-label">Padding</span>
          <span class="tooltip-card-pill">${paddingStr}</span>
        </div>
        <div class="tooltip-card-row">
          <span class="tooltip-card-label">Margin</span>
          <span class="tooltip-card-pill">${marginStr}</span>
        </div>
      `;

      let top = rect.top - 140;
      if (top < 10) top = rect.bottom + 10;

      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${Math.max(10, rect.left)}px`;
      this.tooltip.style.display = 'flex';
    });
  }

  /**
   * Sets active selected element box
   * @param {Element} element 
   */
  updateSelected(element) {
    if (!element) {
      this.selectedBox.style.display = 'none';
      this.selectedElement = null;
      return;
    }

    this.selectedElement = element;
    this.selectedBox.style.display = 'block';
    this.repositionSelectedBox();
  }

  /**
   * Repositions selected box using absolute document coordinates so it stays fixed to the element on scroll
   */
  repositionSelectedBox() {
    if (!this.selectedElement) return;
    const rect = this.selectedElement.getBoundingClientRect();
    this.selectedBox.style.top = `${rect.top + window.scrollY}px`;
    this.selectedBox.style.left = `${rect.left + window.scrollX}px`;
    this.selectedBox.style.width = `${rect.width}px`;
    this.selectedBox.style.height = `${rect.height}px`;
  }

  /**
   * Positions box element given client rect
   */
  positionBox(box, rect) {
    box.style.top = `${rect.top}px`;
    box.style.left = `${rect.left}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
  }

  hideHover() {
    if (this.hoverBox) this.hoverBox.style.display = 'none';
    if (this.tooltip) this.tooltip.style.display = 'none';
    this.activeElement = null;
  }

  hideAll() {
    this.hideHover();
    if (this.selectedBox) this.selectedBox.style.display = 'none';
    this.selectedElement = null;
  }
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
