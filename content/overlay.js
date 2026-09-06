/**
 * Website Inspector AI - Visual Overlay Engine
 * 
 * Manages hover bounding box highlights and selection indicators.
 * Uses Shadow DOM to ensure zero style leakage between host site and extension UI.
 */

import { OVERLAY_STYLES } from '../utils/constants.js';

export class InspectorOverlay {
  constructor() {
    this.hostElement = null;
    this.shadowRoot = null;
    this.hoverBox = null;
    this.selectedBox = null;
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
      .inspector-box {
        position: fixed;
        pointer-events: none;
        box-sizing: border-box;
        transition: all 0.05s ease-out;
        z-index: ${OVERLAY_STYLES.Z_INDEX};
        border-radius: 2px;
      }

      .hover-box {
        border: ${OVERLAY_STYLES.HOVER_BORDER};
        background: ${OVERLAY_STYLES.HOVER_BG};
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
      }

      .selected-box {
        position: absolute;
        border: ${OVERLAY_STYLES.SELECTED_BORDER};
        background: ${OVERLAY_STYLES.SELECTED_BG};
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
      }

      .inspector-tooltip {
        position: fixed;
        pointer-events: none;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #38bdf8;
        border-radius: 4px;
        padding: 3px 8px;
        font-family: monospace;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        z-index: ${OVERLAY_STYLES.Z_INDEX + 1};
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }

      .tooltip-tag { color: #38bdf8; }
      .tooltip-id { color: #f59e0b; }
      .tooltip-class { color: #10b981; }
      .tooltip-dim { color: #94a3b8; font-size: 10px; margin-left: 6px; }
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
    this.shadowRoot.appendChild(this.selectedBox);

    // Tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'inspector-tooltip';
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

      // Tooltip positioning
      const tag = element.tagName.toLowerCase();
      const id = element.id ? `#${element.id}` : '';
      const classes = Array.from(element.classList).slice(0, 2).map(c => `.${c}`).join('');
      const dim = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;

      this.tooltip.innerHTML = `
        <span class="tooltip-tag">${tag}</span>
        <span class="tooltip-id">${id}</span>
        <span class="tooltip-class">${classes}</span>
        <span class="tooltip-dim">${dim}</span>
      `;

      let top = rect.top - 28;
      if (top < 5) top = rect.bottom + 5;

      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${Math.max(5, rect.left)}px`;
      this.tooltip.style.display = 'block';
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
