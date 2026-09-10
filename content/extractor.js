/**
 * Qursor++ - Element Data Extractor (YouTube Thumbnail & Media Intelligence)
 * 
 * Master analytical engine collecting complete DevTools-grade DOM properties,
 * computed styles, box model, hierarchy, selector paths, accessibility, and element-specific details.
 * Supports YouTube thumbnails, lazy-loaded images, SVG graphics, and dynamic media containers.
 */

import { getCssSelector, getXPath } from '../utils/selector.js';
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
  const xpath = getXPath(element);
  const domInfo = getDomHierarchy(element);
  const styles = extractComputedStyles(element);
  const rawCss = getRawCssString(element);

  // Accessibility & ARIA Telemetry
  const ariaAttrs = extractAriaAttributes(element);
  const implicitRole = getImplicitRole(element);
  const explicitRole = element.getAttribute('role');
  const role = explicitRole || implicitRole || 'N/A';
  const accessibleName = extractAccessibleName(element);

  // General Attributes & Properties
  const general = {
    tagName: tag.toUpperCase(),
    id: element.id || 'N/A',
    classList: Array.from(element.classList),
    textContent: getCleanTextContent(element, 300),
    innerHTML: element.innerHTML ? (element.innerHTML.length > 500 ? element.innerHTML.substring(0, 500) + '...' : element.innerHTML) : '',
    outerHTML: element.outerHTML ? (element.outerHTML.length > 500 ? element.outerHTML.substring(0, 500) + '...' : element.outerHTML) : '',
    fullOuterHTML: element.outerHTML || '',
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
    xpath,
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
    rawCss,
    pageStyles,
    baseUrl: window.location.href,
    widthPx: Math.round(rect.width),
    heightPx: Math.round(rect.height)
  };
}

/**
 * Collects webpage stylesheet content for accurate component preview rendering
 * @returns {string}
 */
export function getPageStylesheets() {
  const styles = [];

  document.querySelectorAll('style').forEach(styleTag => {
    if (styleTag.textContent && !styleTag.closest('#website-inspector-root')) {
      styles.push(`<style>${styleTag.textContent}</style>`);
    }
  });

  document.querySelectorAll('link[rel="stylesheet"]').forEach(linkTag => {
    if (linkTag.href) {
      styles.push(`<link rel="stylesheet" href="${linkTag.href}">`);
    }
  });

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
