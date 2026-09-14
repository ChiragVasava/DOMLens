/**
 * Qursor++ - Centralized Component State Model
 * 
 * Serves as the authoritative single source of truth for the inspected component.
 * Synchronizes state across Live Preview, Overview, Typography, Colors, Layout,
 * Code generation, Edit (LLM modifications), and Assets.
 */

export class ComponentState {
  constructor() {
    this.original = {
      html: '',
      css: '',
      elementData: null,
      styles: {},
      assets: []
    };

    this.current = {
      html: '',
      css: '',
      changes: []
    };

    this.selectedElement = null;
    this.theme = 'dark'; // 'light' | 'dark' | 'system'
    this.zoom = null;     // null = auto-fit, number = explicit scale (e.g. 1.0)
    this.activeTab = 'live';
    this.codeScope = 'Selected'; // 'Selected' | 'Full Page'
    this.codeFormat = 'html+css';   // 'html+css' | 'react'
    this.assetFilter = 'All';

    this.editState = {
      instruction: '',
      isApplying: false,
      error: null,
      changes: []
    };

    this._listeners = new Set();
  }

  /**
   * Subscribes a listener callback to state mutations
   * @param {Function} listener (state, eventType) => void
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this._listeners.add(listener);
    }
    return () => this._listeners.delete(listener);
  }

  /**
   * Notifies all registered subscribers
   * @param {string} eventType 
   */
  notify(eventType = 'change') {
    this._listeners.forEach(fn => {
      try {
        fn(this, eventType);
      } catch (err) {
        console.error('[Qursor++ ComponentState] Error in subscriber:', err);
      }
    });
  }

  /**
   * Sets new element selection and initializes both original and current state
   * @param {Element} element
   * @param {Object} elementData
   * @param {string} html
   * @param {string} css
   * @param {Array} assets
   */
  setElement(element, elementData, html, css, assets = []) {
    this.selectedElement = element;
    this.original = {
      html: html || '',
      css: css || '',
      elementData: elementData || null,
      styles: (elementData && elementData.styles) ? elementData.styles : {},
      assets: Array.isArray(assets) ? assets : []
    };

    this.current = {
      html: html || '',
      css: css || '',
      changes: []
    };

    this.zoom = null;
    this.editState = {
      instruction: '',
      isApplying: false,
      error: null,
      changes: []
    };

    this.notify('element_selected');
  }

  /**
   * Updates the current component representation (e.g. after LLM edit)
   * @param {string} html 
   * @param {string} css 
   * @param {Array<string>} [changes] 
   */
  updateCurrent(html, css, changes = []) {
    if (typeof html === 'string') this.current.html = html;
    if (typeof css === 'string') this.current.css = css;
    if (Array.isArray(changes)) {
      this.current.changes = changes;
      this.editState.changes = changes;
    }
    this.editState.error = null;
    this.notify('current_updated');
  }

  /**
   * Restores current component to original captured state
   */
  resetToOriginal() {
    this.current.html = this.original.html;
    this.current.css = this.original.css;
    this.current.changes = [];
    this.editState = {
      instruction: '',
      isApplying: false,
      error: null,
      changes: []
    };
    this.notify('reset');
  }

  /**
   * Updates theme preference
   * @param {string} theme ('light' | 'dark' | 'system')
   */
  setTheme(theme) {
    if (this.theme !== theme) {
      this.theme = theme;
      this.notify('theme_changed');
    }
  }

  /**
   * Updates Live preview zoom scale
   * @param {number|null} zoom
   */
  setZoom(zoom) {
    this.zoom = zoom;
    this.notify('zoom_changed');
  }

  /**
   * Updates active navigation tab
   * @param {string} tabId 
   */
  setActiveTab(tabId) {
    if (this.activeTab !== tabId) {
      this.activeTab = tabId;
      this.notify('tab_changed');
    }
  }

  /**
   * Updates code format
   * @param {string} format 
   */
  setCodeFormat(format) {
    if (this.codeFormat !== format) {
      this.codeFormat = format;
      this.notify('code_format_changed');
    }
  }

  /**
   * Updates code scope
   * @param {string} scope ('Selected' | 'Full Page')
   */
  setCodeScope(scope) {
    if (this.codeScope !== scope) {
      this.codeScope = scope;
      this.notify('code_scope_changed');
    }
  }

  /**
   * Updates asset filter category
   * @param {string} filter 
   */
  setAssetFilter(filter) {
    if (this.assetFilter !== filter) {
      this.assetFilter = filter;
      this.notify('asset_filter_changed');
    }
  }

  /**
   * Updates edit state details
   * @param {Object} partial 
   */
  setEditState(partial) {
    this.editState = { ...this.editState, ...partial };
    this.notify('edit_state_changed');
  }

  /**
   * Checks if an element is currently inspected
   * @returns {boolean}
   */
  hasElement() {
    return !!(this.selectedElement && this.original.elementData);
  }
}
