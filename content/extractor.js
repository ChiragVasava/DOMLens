/**
 * Qursor++ - Element Data Extractor (YouTube Thumbnail & Media Intelligence)
 * 
 * Master analytical engine collecting complete DevTools-grade DOM properties,
 * computed styles, box model, hierarchy, selector paths, accessibility, and element-specific details.
 * Supports YouTube thumbnails, lazy-loaded images, SVG graphics, and dynamic media containers.
 */

import { getCssSelector } from '../utils/selector.js';
import { getDomHierarchy, getElementAttributes, getCleanTextContent } from '../utils/dom.js';
import { extractComputedStyles, getRawCssString } from '../utils/style.js';

/**
 * Collects complete detailed analysis for a target DOM element
 * @param {Element} element 
 * @returns {Object} Structured inspection payload
 */
export function extractElementData(element) {
  if (!(element instanceof Element)) return null;

  const tag = element.tagName.toLowerCase();
  const attributes = getElementAttributes(element);
  const selector = getCssSelector(element);
  const domInfo = getDomHierarchy(element);
  const styles = extractComputedStyles(element);
  const rawCss = getRawCssString(element);

  // Accessibility & ARIA Telemetry
  const ariaAttrs = extractAriaAttributes(element);
  const implicitRole = getImplicitRole(element);
  const explicitRole = element.getAttribute('role');
  const role = explicitRole || implicitRole || 'N/A';
  const accessibleName = extractAccessibleName(element);

  // Dedicated Component HTML & CSS Extraction
  const componentHtml = extractComponentHTML(element);
  const componentCss = extractComponentCSS(element) || rawCss;

  // General Attributes & Properties
  const general = {
    tagName: tag.toUpperCase(),
    id: element.id || 'N/A',
    classList: Array.from(element.classList),
    textContent: getCleanTextContent(element, 300),
    innerHTML: element.innerHTML ? (element.innerHTML.length > 500 ? element.innerHTML.substring(0, 500) + '...' : element.innerHTML) : '',
    outerHTML: element.outerHTML ? (element.outerHTML.length > 500 ? element.outerHTML.substring(0, 500) + '...' : element.outerHTML) : '',
    fullOuterHTML: componentHtml || element.outerHTML || '',
    value: element.value !== undefined ? String(element.value) : 'N/A',
    name: element.getAttribute('name') || 'N/A',
    type: element.getAttribute('type') || 'N/A',
    placeholder: element.getAttribute('placeholder') || 'N/A',
    title: element.title || 'N/A',
    href: element.href || element.getAttribute('href') || 'N/A',
    src: element.src || element.getAttribute('src') || 'N/A',
    alt: element.alt || element.getAttribute('alt') || 'N/A',
    role: role,
    accessibleName: accessibleName,
    ariaAttributes: ariaAttrs,
    tabIndex: element.tabIndex,
    isContentEditable: element.isContentEditable,
    disabled: element.disabled !== undefined ? element.disabled : false,
    required: element.required !== undefined ? element.required : false,
    hidden: element.hidden || styles.layout.display === 'none'
  };

  // Element Specific Details (Images, YouTube Thumbnails, Links, Buttons, Inputs, SVGs)
  const specialDetails = extractSpecializedDetails(element, tag, styles);
  const pageStyles = getPageStylesheets();
  const rect = element.getBoundingClientRect();

  return {
    tag: general.tagName,
    selector,
    classes: general.classList,
    general,
    dom: domInfo,
    attributes,
    styles,
    layout: styles.layout,
    spacing: styles.spacing,
    typography: styles.typography,
    colors: styles.colors,
    border: styles.border,
    flexGrid: styles.flexGrid,
    specialDetails,
    rawCss: componentCss,
    componentHtml,
    componentCss,
    pageStyles,
    baseUrl: window.location.href,
    widthPx: Math.round(rect.width),
    heightPx: Math.round(rect.height)
  };
}

/**
 * Extracts clean, isolated component HTML with absolute URLs and form value preservation
 * @param {Element} element
 * @returns {string}
 */
export function extractComponentHTML(element) {
  if (!(element instanceof Element)) return '';

  const clone = element.cloneNode(true);

  // Remove internal inspector elements if present
  clone.querySelectorAll('#website-inspector-root, .website-inspector-box').forEach(el => el.remove());

  // Resolve relative URLs for images, media, links
  const base = document.baseURI || window.location.href;

  clone.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      try {
        img.setAttribute('src', new URL(src, base).href);
      } catch (e) {}
    }
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      try {
        const resolved = srcset.split(',').map(part => {
          const trimmed = part.trim();
          const [url, descriptor] = trimmed.split(/\s+/);
          if (url) {
            const abs = new URL(url, base).href;
            return descriptor ? `${abs} ${descriptor}` : abs;
          }
          return part;
        }).join(', ');
        img.setAttribute('srcset', resolved);
      } catch (e) {}
    }
  });

  clone.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      try {
        a.setAttribute('href', new URL(href, base).href);
      } catch (e) {}
    }
  });

  clone.querySelectorAll('source, video, audio').forEach(media => {
    const src = media.getAttribute('src');
    if (src) {
      try {
        media.setAttribute('src', new URL(src, base).href);
      } catch (e) {}
    }
  });

  // Preserve form input values and states
  const origInputs = element.querySelectorAll('input, textarea, select');
  const cloneInputs = clone.querySelectorAll('input, textarea, select');
  origInputs.forEach((orig, idx) => {
    const cl = cloneInputs[idx];
    if (!cl) return;
    if (orig.tagName === 'TEXTAREA') {
      cl.textContent = orig.value;
    } else if (orig.type === 'checkbox' || orig.type === 'radio') {
      if (orig.checked) cl.setAttribute('checked', '');
      else cl.removeAttribute('checked');
    } else if (orig.value !== undefined) {
      cl.setAttribute('value', orig.value);
    }
  });

  // Ensure SVGs have proper xmlns attribute
  if (clone.tagName.toLowerCase() === 'svg' && !clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  clone.querySelectorAll('svg').forEach(svg => {
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
  });

  return clone.outerHTML || '';
}

/**
 * Extracts self-contained, scoped CSS required to visually reproduce the component in isolation
 * @param {Element} element
 * @returns {string} Scoped CSS declarations block
 */
export function extractComponentCSS(element) {
  if (!(element instanceof Element)) return '';

  const rules = [];

  function buildDeclarations(el, isRoot = false) {
    const cs = window.getComputedStyle(el);
    const props = [
      'display', 'position', 'box-sizing',
      'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration',
      'color', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
      'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
      'box-shadow', 'opacity', 'overflow', 'cursor', 'z-index',
      'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'gap', 'row-gap', 'column-gap',
      'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row'
    ];

    const lines = [];
    for (const prop of props) {
      const val = cs.getPropertyValue(prop);
      if (!val) continue;
      if (val === 'none' && (prop === 'background-image' || prop === 'box-shadow' || prop === 'text-decoration')) continue;
      if (val === 'auto' && (prop === 'z-index' || prop === 'width' || prop === 'height') && !isRoot) continue;
      if (val === 'normal' && (prop === 'line-height' || prop === 'letter-spacing' || prop === 'gap')) continue;
      if (val === '0px' && (prop.startsWith('margin') || prop.startsWith('padding') || prop.startsWith('border-radius'))) continue;
      if (val === 'rgba(0, 0, 0, 0)' && (prop === 'background-color' || prop.includes('color'))) continue;
      if (val === '0px none rgb(0, 0, 0)' || val === '0px none rgb(255, 255, 255)') continue;

      lines.push(`  ${prop}: ${val};`);
    }
    return lines.join('\n');
  }

  // 1. Root element styles
  const rootTag = element.tagName.toLowerCase();
  const rootId = element.id ? `#${element.id}` : '';
  const rootClass = element.classList.length ? `.${Array.from(element.classList).join('.')}` : '';
  const rootSelector = rootId || (rootClass ? `${rootTag}${rootClass}` : rootTag);

  const rootDecls = buildDeclarations(element, true);
  if (rootDecls) {
    rules.push(`/* Root: <${rootTag}> */\n${rootSelector} {\n${rootDecls}\n}`);
  }

  // 2. Descendants (up to 50 elements)
  const descendants = Array.from(element.querySelectorAll('*')).slice(0, 50);
  const seenSelectors = new Set();
  seenSelectors.add(rootSelector);

  for (const child of descendants) {
    const cTag = child.tagName.toLowerCase();
    const cId = child.id ? `#${child.id}` : '';
    const cClasses = Array.from(child.classList).filter(c => !c.startsWith('website-inspector'));
    let cSel = '';

    if (cId) {
      cSel = cId;
    } else if (cClasses.length) {
      cSel = `${rootSelector} .${cClasses[0]}`;
    } else {
      cSel = `${rootSelector} ${cTag}`;
    }

    if (seenSelectors.has(cSel)) continue;
    seenSelectors.add(cSel);

    const decls = buildDeclarations(child, false);
    if (decls) {
      rules.push(`${cSel} {\n${decls}\n}`);
    }
  }

  return rules.join('\n\n');
}

/**
 * Collects webpage stylesheet content for accurate component preview rendering
 * @returns {string}
 */
export function getPageStylesheets() {
  const styles = [];

  document.querySelectorAll('link[rel="stylesheet"]').forEach(linkTag => {
    if (linkTag.href && !linkTag.href.includes('chrome-extension://')) {
      styles.push(`<link rel="stylesheet" href="${linkTag.href}">`);
    }
  });

  let totalInlineBytes = 0;
  const MAX_INLINE_BYTES = 50000;

  const styleTags = document.querySelectorAll('style');
  for (let i = 0; i < styleTags.length; i++) {
    const styleTag = styleTags[i];
    if (styleTag.closest('#website-inspector-root')) continue;
    const text = styleTag.textContent || '';
    if (text.length > 0 && totalInlineBytes < MAX_INLINE_BYTES) {
      const chunk = text.length > 10000 ? text.substring(0, 10000) : text;
      styles.push(`<style>${chunk}</style>`);
      totalInlineBytes += chunk.length;
    }
  }

  return styles.join('\n');
}

function extractAriaAttributes(element) {
  const aria = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name.startsWith('aria-')) {
      aria[attr.name] = attr.value;
    }
  }
  return aria;
}

function extractAccessibleName(element) {
  if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');
  if (element.getAttribute('aria-labelledby')) {
    const labelEl = document.getElementById(element.getAttribute('aria-labelledby'));
    if (labelEl) return labelEl.textContent.trim();
  }
  if (element.labels && element.labels.length > 0) return element.labels[0].textContent.trim();
  if (element.alt) return element.alt;
  if (element.title) return element.title;
  return getCleanTextContent(element, 50) || 'N/A';
}

function getImplicitRole(element) {
  const tag = element.tagName.toLowerCase();
  const type = element.getAttribute('type');

  if (tag === 'a' && element.hasAttribute('href')) return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') return 'heading';
  if (tag === 'img') return 'img';
  if (tag === 'nav') return 'navigation';
  if (tag === 'main') return 'main';
  if (tag === 'header') return 'banner';
  if (tag === 'footer') return 'contentinfo';
  if (tag === 'input') {
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
    return 'textbox';
  }
  return null;
}

/**
 * Extracts type-specific details for Images (including YouTube thumbnails), Links, Buttons, Inputs, SVGs
 */
function extractSpecializedDetails(element, tag, styles) {
  const details = {};

  // Check if selected element OR any child is an image or thumbnail container
  const childImg = tag === 'img' ? element : element.querySelector('img');
  let bgImageUrl = null;

  if (styles && styles.colors && styles.colors.backgroundColor && styles.colors.backgroundColor !== 'transparent') {
    const cs = window.getComputedStyle(element);
    if (cs && cs.backgroundImage && cs.backgroundImage !== 'none') {
      const match = cs.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
      if (match) bgImageUrl = match[1];
    }
  }

  if (childImg || bgImageUrl) {
    const img = /** @type {HTMLImageElement} */ (childImg || {});
    const url = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-thumb') || bgImageUrl || 'N/A';

    details.type = 'IMAGE';
    details.imageUrl = url;
    details.naturalWidth = img.naturalWidth ? `${img.naturalWidth}px` : 'Auto';
    details.naturalHeight = img.naturalHeight ? `${img.naturalHeight}px` : 'Auto';
    details.displayedWidth = `${Math.round(element.getBoundingClientRect().width)}px`;
    details.displayedHeight = `${Math.round(element.getBoundingClientRect().height)}px`;
    details.altText = img.alt || element.getAttribute('aria-label') || 'YouTube/Web Thumbnail';
    details.isLazyLoaded = img.loading === 'lazy';
  } else if (tag === 'svg' || element.querySelector('svg')) {
    details.type = 'SVG';
    details.hasInlineSvg = true;
  } else if (tag === 'a') {
    const link = /** @type {HTMLAnchorElement} */ (element);
    details.type = 'LINK';
    details.href = link.href || 'N/A';
    details.target = link.target || '_self';
    details.rel = link.rel || 'N/A';
  } else if (tag === 'button' || (tag === 'input' && ['button', 'submit', 'reset'].includes(element.type))) {
    details.type = 'BUTTON';
    details.buttonType = element.type || 'button';
    details.isDisabled = element.disabled || false;
    details.formId = element.form ? element.form.id || 'Parent Form' : 'None';
  } else if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    details.type = 'INPUT';
    details.inputType = element.type || tag;
    details.value = element.value || 'N/A';
    details.placeholder = element.placeholder || 'N/A';
    details.autocomplete = element.autocomplete || 'N/A';
    details.isRequired = element.required || false;
    details.isReadonly = element.readOnly || false;
  }

  return details;
}
