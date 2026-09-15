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
/**
 * Traces the ancestor tree to find effective non-transparent background color,
 * computed text color, font family, and color scheme classification.
 * This guarantees the selected component preserves its original appearance
 * regardless of whether Qursor++ extension UI is in Light or Dark mode.
 * 
 * @param {Element} element
 * @returns {{ effectiveBg: string, effectiveColor: string, effectiveFontFamily: string, colorScheme: 'dark'|'light' }}
 */
export function getEffectiveElementColors(element) {
  if (!(element instanceof Element)) {
    return {
      effectiveBg: 'rgb(255, 255, 255)',
      effectiveColor: 'rgb(0, 0, 0)',
      effectiveFontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      colorScheme: 'light'
    };
  }

  let curr = element;
  let effectiveBg = '';
  let effectiveColor = '';
  let effectiveFontFamily = '';

  try {
    const cs = window.getComputedStyle(element);
    effectiveColor = cs.getPropertyValue('color') || 'rgb(0, 0, 0)';
    effectiveFontFamily = cs.getPropertyValue('font-family') || '-apple-system, BlinkMacSystemFont, sans-serif';

    // Walk up the DOM tree looking for the first non-transparent background
    while (curr && curr !== document.documentElement) {
      const c = window.getComputedStyle(curr);
      const bg = c.getPropertyValue('background-color');
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
        effectiveBg = bg;
        break;
      }
      curr = curr.parentElement;
    }

    if (!effectiveBg || effectiveBg === 'transparent' || effectiveBg === 'rgba(0, 0, 0, 0)') {
      const htmlCs = window.getComputedStyle(document.documentElement);
      const htmlBg = htmlCs.getPropertyValue('background-color');
      if (htmlBg && htmlBg !== 'transparent' && htmlBg !== 'rgba(0, 0, 0, 0)') {
        effectiveBg = htmlBg;
      } else if (document.body) {
        const bodyCs = window.getComputedStyle(document.body);
        const bodyBg = bodyCs.getPropertyValue('background-color');
        if (bodyBg && bodyBg !== 'transparent' && bodyBg !== 'rgba(0, 0, 0, 0)') {
          effectiveBg = bodyBg;
        }
      }
    }
  } catch (e) {
    console.warn('[Qursor++ Extractor] Error resolving effective colors:', e);
  }

  // Fallback if the whole page is transparent
  if (!effectiveBg || effectiveBg === 'transparent' || effectiveBg === 'rgba(0, 0, 0, 0)') {
    const rgb = (effectiveColor || '').match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const lum = (0.299 * parseInt(rgb[0], 10) + 0.587 * parseInt(rgb[1], 10) + 0.114 * parseInt(rgb[2], 10)) / 255;
      effectiveBg = lum > 0.5 ? 'rgb(13, 17, 23)' : 'rgb(255, 255, 255)';
    } else {
      effectiveBg = 'rgb(255, 255, 255)';
    }
  }

  // Calculate luminance of effectiveBg to classify colorScheme
  let isDark = false;
  const bgMatch = effectiveBg.match(/\d+/g);
  if (bgMatch && bgMatch.length >= 3) {
    const r = parseInt(bgMatch[0], 10);
    const g = parseInt(bgMatch[1], 10);
    const b = parseInt(bgMatch[2], 10);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    isDark = lum < 0.5;
  }

  return {
    effectiveBg,
    effectiveColor,
    effectiveFontFamily,
    colorScheme: isDark ? 'dark' : 'light'
  };
}

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

  // Effective visual colors & typography context from original page
  const effectiveColors = getEffectiveElementColors(element);

  // Accessibility & ARIA Telemetry
  const ariaAttrs = extractAriaAttributes(element);
  const implicitRole = getImplicitRole(element);
  const explicitRole = element.getAttribute('role');
  const role = explicitRole || implicitRole || 'N/A';
  const accessibleName = extractAccessibleName(element);

  // Dedicated Component HTML & CSS Extraction
  const componentHtml = extractComponentHTML(element);
  const componentCss = extractComponentCSS(element, effectiveColors) || rawCss;

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
    effectiveBg: effectiveColors.effectiveBg,
    effectiveColor: effectiveColors.effectiveColor,
    effectiveFontFamily: effectiveColors.effectiveFontFamily,
    colorScheme: effectiveColors.colorScheme,
    baseUrl: window.location.href,
    widthPx: Math.round(rect.width),
    heightPx: Math.round(rect.height)
  };
}

/**
 * Extracts clean, isolated component HTML with absolute URLs, SVG symbol inlining, and media preservation
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

  const origImgs = element.tagName.toLowerCase() === 'img'
    ? [element]
    : Array.from(element.querySelectorAll('img'));
  const cloneImgs = clone.tagName.toLowerCase() === 'img'
    ? [clone]
    : Array.from(clone.querySelectorAll('img'));

  cloneImgs.forEach((img, idx) => {
    const orig = origImgs[idx];
    // Prioritize active currentSrc (critical for YouTube, lazy images, SPAs)
    const realSrc = (orig && (orig.currentSrc || orig.src))
      || img.getAttribute('src')
      || (orig && (orig.getAttribute('data-thumb') || orig.getAttribute('data-src') || orig.getAttribute('data-thumbnail-src')))
      || img.getAttribute('data-thumb')
      || img.getAttribute('data-src');

    if (realSrc) {
      try {
        img.setAttribute('src', new URL(realSrc, base).href);
      } catch (e) {
        img.setAttribute('src', realSrc);
      }
    }

    const srcset = (orig && orig.getAttribute('srcset')) || img.getAttribute('srcset');
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

  // Instagram & modern web SVG <use> symbol inlining:
  // Detects references to symbols in the host page and inlines them into <defs>
  const uses = clone.querySelectorAll('use');
  if (uses.length > 0) {
    const symbolMap = new Map();
    uses.forEach(useEl => {
      const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
      if (!href) return;
      if (href.startsWith('#')) {
        const id = href.slice(1);
        if (!symbolMap.has(id)) {
          const hostEl = document.getElementById(id);
          if (hostEl) {
            symbolMap.set(id, hostEl.outerHTML);
          }
        }
      } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
        try {
          const absHref = new URL(href, base).href;
          useEl.setAttribute('href', absHref);
          if (useEl.hasAttribute('xlink:href')) {
            useEl.setAttribute('xlink:href', absHref);
          }
        } catch (e) {}
      }
    });

    if (symbolMap.size > 0) {
      const defsSvg = document.createElement('svg');
      defsSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      defsSvg.style.display = 'none';
      defsSvg.innerHTML = `<defs>${Array.from(symbolMap.values()).join('\n')}</defs>`;
      clone.insertBefore(defsSvg, clone.firstChild);
    }
  }

  // Handle YouTube custom elements with Shadow DOM if present
  try {
    const origCustoms = Array.from(element.querySelectorAll('*')).filter(el => el.shadowRoot);
    if (origCustoms.length > 0) {
      origCustoms.forEach(origEl => {
        const tag = origEl.tagName.toLowerCase();
        const cloneTarget = clone.querySelector(tag);
        if (cloneTarget && !cloneTarget.hasChildNodes() && origEl.shadowRoot) {
          const shadowChildren = Array.from(origEl.shadowRoot.children);
          shadowChildren.forEach(sc => {
            cloneTarget.appendChild(sc.cloneNode(true));
          });
        }
      });
    }
  } catch (e) {}

  return clone.outerHTML || '';
}

/**
 * Extracts self-contained, scoped CSS required to visually reproduce the component in isolation.
 * Automatically stamps effective background and text color to preserve source of truth.
 * Captures ::before and ::after pseudo-elements.
 * 
 * @param {Element} element
 * @param {Object} [effectiveColors=null]
 * @returns {string} Scoped CSS declarations block
 */
export function extractComponentCSS(element, effectiveColors = null) {
  if (!(element instanceof Element)) return '';

  const colors = effectiveColors || getEffectiveElementColors(element);
  const rect = element.getBoundingClientRect();
  const widthPx = Math.round(rect.width);

  const rules = [];

  const CSS_PROPS = [
    // Layout
    'display', 'position', 'box-sizing',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'overflow', 'overflow-x', 'overflow-y',
    // Spacing
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    // Flex
    'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'justify-content', 'align-items', 'align-content', 'align-self', 'gap', 'row-gap', 'column-gap',
    // Grid
    'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
    'grid-auto-columns', 'grid-auto-rows', 'place-items', 'justify-items',
    // Typography
    'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
    'letter-spacing', 'text-align', 'text-transform', 'text-decoration',
    'white-space', 'word-break', 'overflow-wrap',
    // Visual & Colors
    'color', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
    'opacity', 'box-shadow', 'text-shadow', 'filter', 'backdrop-filter', 'transform', 'transform-origin',
    // Borders
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-width', 'border-style', 'border-color',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
    // Media & Other
    'object-fit', 'object-position', 'aspect-ratio', 'vertical-align', 'visibility', 'cursor', 'z-index'
  ];

  function buildDeclarations(el, isRoot = false) {
    const cs = window.getComputedStyle(el);
    const lines = [];

    for (const prop of CSS_PROPS) {
      if (isRoot) {
        if (prop === 'position') {
          lines.push('  position: relative !important;');
          continue;
        }
        if (prop === 'top' || prop === 'left' || prop === 'right' || prop === 'bottom') {
          lines.push(`  ${prop}: auto !important;`);
          continue;
        }
        if (prop === 'margin' || prop === 'margin-top' || prop === 'margin-left' || prop === 'margin-right' || prop === 'margin-bottom') {
          if (prop === 'margin') lines.push('  margin: 0 auto !important;');
          continue;
        }
      }

      const val = cs.getPropertyValue(prop);
      if (!val) continue;
      if (val === 'none' && (prop === 'background-image' || prop === 'box-shadow' || prop === 'text-decoration' || prop === 'text-shadow' || prop === 'filter' || prop === 'transform')) continue;
      if (val === 'auto' && (prop === 'z-index' || (!isRoot && (prop === 'width' || prop === 'height' || prop === 'min-width' || prop === 'min-height')))) continue;
      if (val === 'normal' && (prop === 'line-height' || prop === 'letter-spacing' || prop === 'gap' || prop === 'row-gap' || prop === 'column-gap')) continue;
      if (val === '0px' && (prop.startsWith('margin') || prop.startsWith('padding') || prop.startsWith('border-radius'))) continue;
      
      // Preserve effective background & text colors on root if transparent
      if (isRoot && prop === 'background-color') {
        const bgVal = (val === 'rgba(0, 0, 0, 0)' || val === 'transparent') ? colors.effectiveBg : val;
        if (bgVal && bgVal !== 'rgba(0, 0, 0, 0)' && bgVal !== 'transparent') {
          lines.push(`  background-color: ${bgVal} !important;`);
        }
        continue;
      }
      if (isRoot && prop === 'color') {
        const fgVal = (val === 'rgba(0, 0, 0, 0)' || val === 'transparent') ? colors.effectiveColor : val;
        if (fgVal) {
          lines.push(`  color: ${fgVal} !important;`);
        }
        continue;
      }
      if (isRoot && prop === 'font-family') {
        const ffVal = val || colors.effectiveFontFamily;
        if (ffVal) {
          lines.push(`  font-family: ${ffVal} !important;`);
        }
        continue;
      }

      if (val === 'rgba(0, 0, 0, 0)' && (prop === 'background-color' || prop.includes('color'))) continue;
      if (val === '0px none rgb(0, 0, 0)' || val === '0px none rgb(255, 255, 255)') continue;

      lines.push(`  ${prop}: ${val};`);
    }

    // Preserve root natural dimensions without squashing
    if (isRoot && widthPx > 20) {
      lines.push(`  width: ${widthPx}px;`);
      lines.push(`  box-sizing: border-box;`);
    }

    return lines.join('\n');
  }

  function extractPseudoStyles(el, pseudoSelector, targetRuleSelector) {
    try {
      const ps = window.getComputedStyle(el, pseudoSelector);
      const content = ps.getPropertyValue('content');
      if (!content || content === 'none' || content === 'normal') return null;
      const lines = [];
      lines.push(`  content: ${content};`);
      const PSEUDO_PROPS = [
        'display', 'position', 'top', 'left', 'right', 'bottom',
        'width', 'height', 'background', 'background-color', 'background-image',
        'border', 'border-radius', 'color', 'font-size', 'opacity', 'z-index', 'transform'
      ];
      for (const p of PSEUDO_PROPS) {
        const val = ps.getPropertyValue(p);
        if (val && val !== 'none' && val !== 'auto' && val !== 'rgba(0, 0, 0, 0)') {
          lines.push(`  ${p}: ${val};`);
        }
      }
      if (lines.length > 1) {
        return `${targetRuleSelector}${pseudoSelector} {\n${lines.join('\n')}\n}`;
      }
    } catch (e) {}
    return null;
  }

  function getRelativePath(child, root) {
    const path = [];
    let curr = child;
    while (curr && curr !== root && curr !== document.body) {
      const parent = curr.parentElement;
      if (!parent) break;
      const tag = curr.tagName.toLowerCase();
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(curr) + 1;
      path.unshift(`${tag}:nth-child(${index})`);
      curr = parent;
    }
    return path.join(' > ');
  }

  // 1. Root element styles
  const rootTag = element.tagName.toLowerCase();
  const rootId = element.id ? `#${element.id}` : '';
  const rootClasses = Array.from(element.classList).filter(c => !c.startsWith('website-inspector'));
  const rootClass = rootClasses.length ? `.${rootClasses.join('.')}` : '';
  const rootSelector = rootId || (rootClass ? `${rootTag}${rootClass}` : rootTag);

  const rootDecls = buildDeclarations(element, true);
  if (rootDecls) {
    rules.push(`/* Root: <${rootTag}> */\n${rootSelector} {\n${rootDecls}\n}`);
  }

  // Root pseudo-elements
  const rootBefore = extractPseudoStyles(element, '::before', rootSelector);
  if (rootBefore) rules.push(rootBefore);
  const rootAfter = extractPseudoStyles(element, '::after', rootSelector);
  if (rootAfter) rules.push(rootAfter);

  // 2. Descendants (up to 250 elements)
  const descendants = Array.from(element.querySelectorAll('*')).slice(0, 250);

  for (const child of descendants) {
    if (child.closest('#website-inspector-root')) continue;

    const relPath = getRelativePath(child, element);
    if (!relPath) continue;

    const selector = `${rootSelector} > ${relPath}`;
    const decls = buildDeclarations(child, false);
    if (decls) {
      rules.push(`${selector} {\n${decls}\n}`);
    }

    const childBefore = extractPseudoStyles(child, '::before', selector);
    if (childBefore) rules.push(childBefore);
    const childAfter = extractPseudoStyles(child, '::after', selector);
    if (childAfter) rules.push(childAfter);
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
