/**
 * Qursor++ - Centralized Component State Model
 * 
 * Serves as the authoritative single source of truth for the inspected component.
 * Synchronizes state across Live Preview, Overview, Typography, Colors, Layout,
 * Code generation, Edit (LLM modifications), and Assets.
 * 
 * Critical Architecture Rule:
 * `current.html` + `current.css` are the single source of truth.
 * Every feature (Live Preview, Code, Edit, React+Tailwind) consumes them.
 */

export class ComponentState {
  constructor() {
    this.original = {
      html: '',
      css: '',
      elementData: null,
      metadata: {},
      styles: {},
      assets: []
    };

    this.current = {
      html: '',
      css: '',
      changes: []
    };

    this.react = {
      code: '',
      status: 'idle' // 'idle' | 'generating' | 'ready' | 'error'
    };

    this.preview = {
      width: null,
      height: null,
      zoom: null // null = auto-fit, number = explicit scale (e.g. 1.0)
    };

    this.selectedElement = null;
    this.theme = 'dark'; // 'light' | 'dark' | 'system'
    this.activeTab = 'live';
    this.codeFormat = 'html+css'; // 'html+css' | 'react'
    this.assetFilter = 'All';

    this.editState = {
      instruction: '',
      isApplying: false,
      error: null,
      changes: []
    };

    this._listeners = new Set();
  }

  get currentHtml() {
    return this.current.html;
  }

  get currentCss() {
    return this.current.css;
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
    const cleanHtml = (html || '').trim();
    const cleanCss = (css || '').trim();

    this.original = {
      html: cleanHtml,
      css: cleanCss,
      elementData: elementData || null,
      metadata: elementData?.general || {},
      styles: (elementData && elementData.styles) ? elementData.styles : {},
      assets: Array.isArray(assets) ? assets : []
    };

    // current.html + current.css are initialized from original
    this.current = {
      html: cleanHtml,
      css: cleanCss,
      changes: []
    };

    this.react = {
      code: '',
      status: 'idle'
    };

    const w = elementData?.widthPx || (element?.getBoundingClientRect ? Math.round(element.getBoundingClientRect().width) : 400);
    const h = elementData?.heightPx || (element?.getBoundingClientRect ? Math.round(element.getBoundingClientRect().height) : 300);
    this.preview.width = w;
    this.preview.height = h;
    this.preview.zoom = null;
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
   * Invalidates any cached/previous React code so it regenerates from updated HTML+CSS.
   * @param {string} html 
   * @param {string} css 
   * @param {Array<string>} [changes] 
   */
  updateCurrent(html, css, changes = []) {
    if (typeof html === 'string') this.current.html = html.trim();
    if (typeof css === 'string') this.current.css = css.trim();
    if (Array.isArray(changes)) {
      this.current.changes = changes;
      this.editState.changes = changes;
    }
    this.editState.error = null;

    // React code MUST invalidate on edit so stale React code is never shown
    this.react.code = '';
    this.react.status = 'idle';

    this.notify('current_updated');
  }

  /**
   * Updates React generation status and code
   * @param {string} code 
   * @param {string} status ('idle' | 'generating' | 'ready' | 'error')
   */
  setReactCode(code, status = 'ready') {
    this.react.code = code || '';
    this.react.status = status;
    this.notify('react_updated');
  }

  /**
   * Restores current component to original captured state
   */
  resetToOriginal() {
    this.current.html = this.original.html;
    this.current.css = this.original.css;
    this.current.changes = [];
    this.react.code = '';
    this.react.status = 'idle';
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
    this.preview.zoom = zoom;
    this.notify('zoom_changed');
  }

  get zoom() {
    return this.preview.zoom;
  }

  set zoom(val) {
    this.preview.zoom = val;
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
