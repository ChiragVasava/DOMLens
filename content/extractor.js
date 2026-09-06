/**
 * Website Inspector AI - Element Data Extractor
 * 
 * Master analytical engine collecting complete DevTools-grade DOM properties,
 * computed styles, box model, hierarchy, selector paths, and element-specific details.
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
    role: element.getAttribute('role') || 'N/A',
    ariaAttributes: extractAriaAttributes(element),
    tabIndex: element.tabIndex,
    isContentEditable: element.isContentEditable,
    disabled: element.disabled !== undefined ? element.disabled : false,
    required: element.required !== undefined ? element.required : false,
    hidden: element.hidden || styles.layout.display === 'none'
  };

  // Element Specific Details
  const specialDetails = extractSpecializedDetails(element, tag);
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

/**
 * Extracts all ARIA attributes present on the element
 * @param {Element} element 
 * @returns {Record<string, string>}
 */
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

/**
 * Extracts type-specific details for Images, Links, Buttons, Inputs
 * @param {Element} element 
 * @param {string} tag 
 * @returns {Object}
 */
function extractSpecializedDetails(element, tag) {
  const details = {};

  if (tag === 'img') {
    const img = /** @type {HTMLImageElement} */ (element);
    details.type = 'IMAGE';
    details.imageUrl = img.currentSrc || img.src || 'N/A';
    details.naturalWidth = `${img.naturalWidth}px`;
    details.naturalHeight = `${img.naturalHeight}px`;
    details.displayedWidth = `${Math.round(img.width)}px`;
    details.displayedHeight = `${Math.round(img.height)}px`;
    details.altText = img.alt || 'N/A';
    details.isLazyLoaded = img.loading === 'lazy';
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
