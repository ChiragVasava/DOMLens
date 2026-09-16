/**
 * Qursor++ - Production-Grade React & Code Generator
 *
 * Synthesizes valid, standalone, warning-free React JSX components from extracted DOM telemetry.
 * Supports HTML+CSS and React JSX (with Tailwind CSS + Scoped Styles).
 *
 * Architecture:
 *  1. sanitizeHtmlForReact  — strip comments, unwrap Polymer templates, strip framework attrs
 *  2. preventInvalidNesting — eliminate nested <button> inside <button> and <a> inside <a>
 *  3. htmlToJsx             — class→className, for→htmlFor (label only), style→JSX object with CSS custom properties
 *  4. parameterizeAssets    — optional avatar/profile asset parameterization with defaults
 *  5. injectTailwindOnRoot  — inject computed Tailwind utility classes on root element
 *  6. validateAndRepairJsx  — syntax & structure validation before presentation
 */

import { mapStylesToTailwind } from './tailwind_mapper.js';

export const CODE_FORMATS = {
  HTML_CSS: 'html+css',
  REACT:    'react'
};

// ─────────────────────────────────────────────────────────────────
// Custom Web Component → Standard Semantic HTML element map
// ─────────────────────────────────────────────────────────────────
const CUSTOM_ELEMENT_MAP = {
  // ── YouTube layout / sectioning ──
  'ytd-app':                                'div',
  'ytd-page-manager':                       'main',
  'ytd-masthead':                           'header',
  'ytd-searchbox':                          'div',
  'ytd-guide-renderer':                     'nav',
  'ytd-guide-section-renderer':             'section',
  'ytd-guide-collapsible-section-entry-renderer': 'div',
  'ytd-guide-collapsible-entry-renderer':   'div',
  'ytd-guide-entry-renderer':               'div',
  'ytd-mini-guide-renderer':                'nav',
  'ytd-mini-guide-entry-renderer':          'div',

  // ── YouTube content cards ──
  'ytd-rich-grid-renderer':                 'div',
  'ytd-rich-grid-row':                      'div',
  'ytd-rich-item-renderer':                 'article',
  'ytd-rich-section-renderer':              'section',
  'ytd-video-renderer':                     'article',
  'ytd-compact-video-renderer':             'article',
  'ytd-grid-video-renderer':                'article',
  'ytd-reel-item-renderer':                 'article',
  'ytd-shelf-renderer':                     'section',
  'ytd-reel-shelf-renderer':                'section',
  'ytd-horizontal-card-list-renderer':      'div',
  'ytd-playlist-renderer':                  'div',
  'ytd-channel-renderer':                   'div',
  'ytd-comment-renderer':                   'div',
  'ytd-comment-thread-renderer':            'div',
  'ytd-thumbnail':                          'div',
  'ytd-thumbnail-overlay-toggle-button-renderer': 'div', // wrappers around buttons
  'ytd-thumbnail-overlay-time-status-renderer':   'span',
  'ytd-badge-supported-renderer':           'span',
  'ytd-button-renderer':                    'div',
  'ytd-toggle-button-renderer':             'div',
  'ytd-menu-renderer':                      'div',
  'ytd-menu-navigation-item-renderer':      'div',
  'ytd-metadata-row-renderer':              'div',
  'ytd-video-meta-block':                   'div',
  'ytd-channel-name':                       'span',
  'ytd-video-owner-renderer':               'div',
  'ytd-watch-metadata':                     'div',
  'ytd-two-column-watch-next-results':      'div',
  'ytd-item-section-renderer':              'section',
  'ytd-continuation-item-renderer':         'div',
  'ytd-section-list-renderer':              'div',
  'ytd-browse':                             'div',
  'ytd-search':                             'div',
  'ytd-watch-flexy':                        'div',
  'ytd-player':                             'div',

  // ── yt-* utility components ──
  'yt-formatted-string':                    'span',
  'yt-attributed-string':                   'span',
  'yt-icon':                                'span',
  'yt-img-shadow':                          'div',
  'yt-icon-button':                         'div', // User Rule 1: Always map wrapper to div to avoid nested <button>
  'yt-chip-cloud-renderer':                 'div',
  'yt-chip-cloud-chip-renderer':            'div',
  'yt-spec-button-shape':                   'div',
  'yt-touch-feedback-shape':                null,  // visual ripple — strip
  'yt-interaction':                         null,  // visual ripple — strip

  // ── Polymer / Paper (tp-yt-*) ──
  'tp-yt-paper-item':                       'div',
  'tp-yt-paper-button':                     'div', // wrappers around native button
  'tp-yt-paper-dialog':                     'dialog',
  'tp-yt-paper-listbox':                    'ul',
  'tp-yt-paper-tooltip':                    'div',
  'tp-yt-iron-list':                        'div',
  'tp-yt-app-toast':                        'div',
  'tp-yt-paper-spinner':                    'div',
  'tp-yt-paper-progress':                   'div',
  'tp-yt-paper-tabs':                       'div',
  'tp-yt-paper-tab':                        'div',
};

// Polymer / Web-Component framework implementation attributes to strip
const FRAMEWORK_ATTRS = [
  'toggleable', 'button-renderer', 'button-next', 'is-red-logo', 'hide-lottie',
  'use-keyboard-focused', 'masthead-container', 'style-target', 'guide-persistent-and-visible',
  'is-header', 'is-primary', 'is-empty', 'is-focused', 'disable-upgrade', 'link-inherit-color',
  'can-show-more', 'loaded', 'focused', 'animated', 'elevation', 'line-end-style',
  'no-transition', 'css-build', 'apply-shim-no-shimming', 'fit', 'layout', 'darker-dark-theme',
  'modern-typography', 'ambient', 'keyboard-focus', 'typography-spacing', 'iron-icon',
  'allow-interaction', 'resolve-url', 'notify-dom-change', 'strip-whitespace',
  'slot'
];

// ─────────────────────────────────────────────────────────────────
// Main Dispatcher
// ─────────────────────────────────────────────────────────────────
export function generateComponentCode(data, format = CODE_FORMATS.HTML_CSS, currentHtml = null, currentCss = null) {
  if (!data && !currentHtml) return '';

  const rawHtml   = currentHtml || (data?.general ? data.general.fullOuterHTML : (data?.outerHTML || ''));
  const rawCss    = currentCss !== null ? currentCss : (data?.rawCss || '');
  const tag       = (data?.tag || 'DIV').toLowerCase();
  const styles    = data?.styles || {};
  const componentName = sanitizeComponentName(
    data?.general ? data.general.id : null,
    data?.classes,
    tag
  );
  const tailwindClasses = mapStylesToTailwind(styles, tag);

  const fmt = (format || '').toLowerCase();
  if (fmt === 'react' || fmt === CODE_FORMATS.REACT) {
    return generateReactTailwind(rawHtml, rawCss, componentName, styles, tailwindClasses, data || { tag, selector: '' });
  }

  // HTML + CSS format
  return generateHtmlWithCss(rawHtml, rawCss);
}

function generateHtmlWithCss(html, css) {
  if (!html) return '';
  const cleanHtml = html.trim();
  const cleanCss = (css || '').trim();
  if (!cleanCss) return cleanHtml;
  return `${cleanHtml}\n\n<style>\n${cleanCss}\n</style>`;
}

// ─────────────────────────────────────────────────────────────────
// React + Tailwind CSS Generator
// ─────────────────────────────────────────────────────────────────

function generateReactTailwind(rawHtml, rawCss, componentName, styles, tailwindClasses, data) {
  if (!rawHtml) return buildEmptyReactComponent(componentName, tailwindClasses);

  // Step 1: Sanitize HTML (strips comments, Polymer template wrappers, framework attrs, maps custom elements)
  let cleanHtml = sanitizeHtmlForReact(rawHtml);

  // Step 2: Prevent invalid interactive nesting (never generate <button> inside <button> or <a> inside <a>)
  cleanHtml = preventInvalidNesting(cleanHtml);

  // Step 3: Parameterize reusable user assets (avatar/profile photo) if detected
  const { htmlWithProps, avatarProp } = parameterizeAssets(cleanHtml);
  cleanHtml = htmlWithProps;

  // Step 4: Convert HTML → React JSX (attribute mapping, for→htmlFor on label only, style objects with CSS custom properties)
  let jsxBody = htmlToJsx(cleanHtml);

  // Step 5: Inject Tailwind classes onto root element
  if (tailwindClasses) {
    jsxBody = injectTailwindOnRoot(jsxBody, tailwindClasses);
  }

  // Step 6: Validate & Repair JSX
  jsxBody = validateAndRepairJsx(jsxBody);

  // Step 7: Build props signature & JSDoc
  const propsBlock = buildPropsJsdoc(data, tailwindClasses);
  const typedProps = buildTypedProps(data, avatarProp);

  // Step 8: Assemble component shell with optional scoped CSS for standalone fidelity
  const cleanCss = (rawCss || '').trim();
  const styleBlock = cleanCss ? `      <style>{\`\n/* Scoped Component Styles */\n${cleanCss}\n      \`}</style>\n` : '';

  return `import React from 'react';

${propsBlock}
export default function ${componentName}(${typedProps}) {
  return (
    <>
${styleBlock}${indentCode(jsxBody, 6)}
    </>
  );
}`;
}

function buildEmptyReactComponent(name, twClasses) {
  return `import React from 'react';\n\nexport default function ${name}({ className = '', children }) {\n  return (\n    <div className={\`${twClasses} \${className}\`}>\n      {children}\n    </div>\n  );\n}`;
}

// ─────────────────────────────────────────────────────────────────
// Step 1: sanitizeHtmlForReact
// ─────────────────────────────────────────────────────────────────
function sanitizeHtmlForReact(html) {
  if (!html) return '';
  let h = html;

  // Strip HTML comments (<!-- ... -->)
  h = h.replace(/<!--[\s\S]*?-->/g, '');

  // User Rule 5: Safely remove Polymer template elements (<ps-dom-if>, <dom-if>, <dom-repeat>, <template>)
  // Unwrap template wrappers so any meaningful content inside is preserved
  h = h.replace(/<\/?(?:ps-dom-if|dom-if|dom-repeat|dom-bind)\b[^>]*>/gi, '');
  h = h.replace(/<template\b[^>]*>([\s\S]*?)<\/template>/gi, '$1');
  // Strip any remaining empty template tags
  h = h.replace(/<template\b[^>]*\/>/gi, '');

  // Strip null-mapped elements (ripples / internal interaction markers)
  Object.entries(CUSTOM_ELEMENT_MAP).forEach(([tag, mapped]) => {
    if (mapped === null) {
      h = h.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
      h = h.replace(new RegExp(`<${tag}[^>]*/>`, 'gi'), '');
    }
  });

  // Replace known custom elements with standard HTML
  Object.entries(CUSTOM_ELEMENT_MAP).forEach(([customTag, htmlTag]) => {
    if (htmlTag === null) return;
    h = h.replace(
      new RegExp(`<(${customTag})(\\s[^>]*)?>`, 'gi'),
      (_, _t, attrs) => `<${htmlTag}${attrs || ''}>`
    );
    h = h.replace(new RegExp(`<\\/${customTag}>`, 'gi'), `</${htmlTag}>`);
  });

  // Generic fallback for any remaining custom elements:
  // ytd-* -> div, yt-* -> span, tp-yt-* -> div
  h = h.replace(/<(ytd-[\w-]+)(\s[^>]*)?>/gi,  (_, _t, attrs) => `<div${attrs || ''}>`);
  h = h.replace(/<\/(ytd-[\w-]+)>/gi, '</div>');
  h = h.replace(/<(yt-[\w-]+)(\s[^>]*)?>/gi,   (_, _t, attrs) => `<span${attrs || ''}>`);
  h = h.replace(/<\/(yt-[\w-]+)>/gi, '</span>');
  h = h.replace(/<(tp-yt-[\w-]+)(\s[^>]*)?>/gi, (_, _t, attrs) => `<div${attrs || ''}>`);
  h = h.replace(/<\/(tp-yt-[\w-]+)>/gi, '</div>');

  // User Rule 4: Strip Polymer/Lit framework implementation attributes
  FRAMEWORK_ATTRS.forEach(attr => {
    h = h.replace(
      new RegExp(`\\s${escapeRegex(attr)}(=("[^"]*"|'[^']*'|\\{[^}]*\\}))?`, 'gi'),
      ''
    );
  });

  // Strip is="dom-if" or any is="..." implementation attribute
  h = h.replace(/\s\bis=(["']).*?\1/gi, '');

  // Strip JSON/HTML-entity blobs in attributes
  h = h.replace(/\s[\w-]+="\{&quot;[\s\S]*?\}"/gi, '');
  h = h.replace(/\s[\w-]+='\{&apos;[\s\S]*?\}'/gi, '');

  // Remove duplicate id attributes (keep first occurrence)
  const seenIds = new Set();
  h = h.replace(/\bid="([^"]*)"/g, (match, id) => {
    if (!id || seenIds.has(id)) return '';
    seenIds.add(id);
    return match;
  });

  // Normalize excessive whitespace
  h = h.replace(/\n{3,}/g, '\n\n');

  return h.trim();
}

// ─────────────────────────────────────────────────────────────────
// Step 2: preventInvalidNesting
// Eliminates nested <button> inside <button> and <a> inside <a>
// ─────────────────────────────────────────────────────────────────
function preventInvalidNesting(html) {
  if (!html) return '';
  let res = html;

  // Fix nested <button> inside <button>
  // If an outer button contains an inner button, convert outer button to <div>
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  let hasNested = true;
  let pass = 0;

  while (hasNested && pass < 5) {
    pass++;
    hasNested = false;
    res = res.replace(buttonRegex, (match, attrs, content) => {
      if (/<button\b/i.test(content)) {
        hasNested = true;
        return `<div${attrs}>${content}</div>`;
      }
      return match;
    });
  }

  // Fix nested <a> inside <a>
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  hasNested = true;
  pass = 0;

  while (hasNested && pass < 5) {
    pass++;
    hasNested = false;
    res = res.replace(anchorRegex, (match, attrs, content) => {
      if (/<a\b/i.test(content)) {
        hasNested = true;
        return `<div${attrs}>${content}</div>`;
      }
      return match;
    });
  }

  return res;
}

// ─────────────────────────────────────────────────────────────────
// Step 3: parameterizeAssets (User-specific avatar reusability)
// ─────────────────────────────────────────────────────────────────
function parameterizeAssets(html) {
  let avatarProp = null;
  let htmlWithProps = html;

  // Detect avatar or profile image
  const avatarImgRegex = /<img\b([^>]*?\b(?:class|id|alt)=(["'])[^"']*(?:avatar|profile-photo|user-avatar)[^"']*\2[^>]*?)>/i;
  const match = html.match(avatarImgRegex);

  if (match) {
    const imgAttrs = match[1];
    const srcMatch = imgAttrs.match(/\bsrc=(["'])(.*?)\1/i);
    if (srcMatch && srcMatch[2] && !srcMatch[2].startsWith('{')) {
      avatarProp = srcMatch[2];
      const updatedAttrs = imgAttrs.replace(/\bsrc=(["'])(.*?)\1/i, 'src={avatarUrl}');
      htmlWithProps = html.replace(match[0], `<img${updatedAttrs}>`);
    }
  }

  return { htmlWithProps, avatarProp };
}

// ─────────────────────────────────────────────────────────────────
// Step 4: htmlToJsx
// ─────────────────────────────────────────────────────────────────
function htmlToJsx(html) {
  if (!html) return '';
  let jsx = html;

  // 1. Tag-specific attribute handling:
  // User Rule 2: htmlFor ONLY on <label>
  // User Rule 6: Form inputs - defaultValue / defaultChecked
  jsx = jsx.replace(/<([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g, (match, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    let newAttrs = attrs;

    // htmlFor only on label
    if (lowerTag === 'label') {
      newAttrs = newAttrs.replace(/\bfor=(["'])(.*?)\1/gi, 'htmlFor=$1$2$1');
    } else {
      // Drop invalid for="..." on <div>, <span>, etc.
      newAttrs = newAttrs.replace(/\bfor=(["'])(.*?)\1\s*/gi, '');
    }

    // Input & Textarea defaultValue / defaultChecked to avoid controlled input warnings
    if (lowerTag === 'input') {
      const isReadOnly = /\breadonly\b/i.test(newAttrs);
      const isButton = /\btype=["'](button|submit|reset|hidden)["']/i.test(newAttrs);
      if (!isReadOnly && !isButton) {
        newAttrs = newAttrs.replace(/\bvalue=(["'])(.*?)\1/gi, 'defaultValue=$1$2$1');
      }
      if (!isReadOnly && /\bchecked\b/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(/\bchecked=(["'])(.*?)\1/gi, 'defaultChecked');
        newAttrs = newAttrs.replace(/\bchecked\b(?!=)/gi, 'defaultChecked');
      }
    } else if (lowerTag === 'textarea') {
      const isReadOnly = /\breadonly\b/i.test(newAttrs);
      if (!isReadOnly) {
        newAttrs = newAttrs.replace(/\bvalue=(["'])(.*?)\1/gi, 'defaultValue=$1$2$1');
      }
    }

    return `<${tagName}${newAttrs}>`;
  });

  // 2. Standard HTML attribute -> JSX attribute renames
  const attrMap = {
    'class=':           'className=',
    'tabindex=':        'tabIndex=',
    'autocomplete=':    'autoComplete=',
    'readonly':         'readOnly',
    'contenteditable=': 'contentEditable=',
    'crossorigin=':     'crossOrigin=',
    'enctype=':         'encType=',
    'maxlength=':       'maxLength=',
    'minlength=':       'minLength=',
    'accesskey=':       'accessKey=',
    'rowspan=':         'rowSpan=',
    'colspan=':         'colSpan=',
    'usemap=':          'useMap=',
    'frameborder=':     'frameBorder=',
    'allowfullscreen':  'allowFullScreen',
    'spellcheck=':      'spellCheck=',
    'novalidate':       'noValidate',
    'autofocus':        'autoFocus',
    'autoplay':         'autoPlay',
    'charset=':         'charSet=',
    'hreflang=':        'hrefLang=',
    'srclang=':         'srcLang=',
    'playsinline':      'playsInline',
  };
  Object.entries(attrMap).forEach(([from, to]) => {
    jsx = jsx.replace(new RegExp(`\\b${escapeRegex(from)}`, 'gi'), to);
  });

  // 3. User Rule 10: SVG attributes to React camelCase
  const svgAttrMap = {
    'viewbox=':                    'viewBox=',
    'fill-rule=':                  'fillRule=',
    'clip-rule=':                  'clipRule=',
    'stroke-width=':               'strokeWidth=',
    'stroke-linecap=':             'strokeLinecap=',
    'stroke-linejoin=':            'strokeLinejoin=',
    'stroke-miterlimit=':          'strokeMiterlimit=',
    'stroke-dasharray=':           'strokeDasharray=',
    'stroke-dashoffset=':          'strokeDashoffset=',
    'stroke-opacity=':             'strokeOpacity=',
    'fill-opacity=':               'fillOpacity=',
    'stop-color=':                 'stopColor=',
    'stop-opacity=':               'stopOpacity=',
    'xlink:href=':                 'xlinkHref=',
    'xmlns:xlink=':                'xmlnsXlink=',
    'preserveaspectratio=':        'preserveAspectRatio=',
    'color-interpolation-filters=':'colorInterpolationFilters=',
  };
  Object.entries(svgAttrMap).forEach(([from, to]) => {
    jsx = jsx.replace(new RegExp(`\\b${escapeRegex(from)}`, 'gi'), to);
  });

  // 4. Decode HTML entities in attribute values
  jsx = jsx.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'");

  // 5. User Rule 3: Convert inline style="..." -> style={{ ... }} preserving CSS custom properties
  jsx = jsx.replace(/\bstyle="([^"]*)"/g, (_, cssText) => `style={${cssStringToJsxStyleObj(cssText)}}`);

  // 6. Clean boolean attributes (e.g. disabled="" -> disabled)
  jsx = jsx.replace(/\b(disabled|required|checked|defaultChecked|readOnly)=""/gi, '$1');

  // 7. Self-close void HTML elements
  const VOID = ['img','input','br','hr','meta','link','area','base','col','embed','param','source','track','wbr'];
  VOID.forEach(el => {
    jsx = jsx.replace(new RegExp(`<(${el})(\\s[^>]*)?(?<!/)>`, 'gi'), (_, tag, attrs) => `<${tag}${attrs || ''} />`);
  });

  // Clean up extra spaces before />
  jsx = jsx.replace(/ {2,}\/>/g, ' />');

  return jsx.trim();
}

// ─────────────────────────────────────────────────────────────────
// CSS text → JSX style object string
// Preserves CSS custom properties as quoted keys (--yt-*: 'value')
// ─────────────────────────────────────────────────────────────────
function cssStringToJsxStyleObj(cssText) {
  if (!cssText || !cssText.trim()) return '{}';
  const entries = cssText.split(';')
    .map(s => s.trim()).filter(Boolean)
    .map(pair => {
      const colonIdx = pair.indexOf(':');
      if (colonIdx === -1) return null;
      const prop  = pair.slice(0, colonIdx).trim();
      const value = pair.slice(colonIdx + 1).trim();
      if (!prop || !value) return null;

      // User Rule 3: CSS custom properties beginning with -- MUST remain quoted string keys
      // and NEVER be camelCased!
      if (prop.startsWith('--')) {
        return `'${prop}': '${value.replace(/'/g, "\\'")}'`;
      }

      // Standard CSS properties -> camelCase
      let camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (camel.startsWith('Ms')) camel = 'ms' + camel.slice(2);
      return `${camel}: '${value.replace(/'/g, "\\'")}'`;
    }).filter(Boolean);

  return entries.length ? `{ ${entries.join(', ')} }` : '{}';
}

// ─────────────────────────────────────────────────────────────────
// Step 5: Inject Tailwind classes onto root element
// ─────────────────────────────────────────────────────────────────
function injectTailwindOnRoot(jsx, twClasses) {
  if (!twClasses) return jsx;
  if (/className="([^"]*)"/.test(jsx)) {
    return jsx.replace(/className="([^"]*)"/, (_, existing) =>
      `className="${(existing + ' ' + twClasses).trim()}"`
    );
  }
  if (/className=\{/.test(jsx)) {
    return jsx.replace(/className=\{([^}]*)\}/, (_, expr) =>
      `className={\`${twClasses} \${${expr.trim()}}\`}`
    );
  }
  return jsx.replace(/^<([a-zA-Z][a-zA-Z0-9-]*)(\s|>)/, (_, tagName, after) =>
    `<${tagName} className="${twClasses}"${after}`
  );
}

// ─────────────────────────────────────────────────────────────────
// Step 6: validateAndRepairJsx (User Rule 11)
// ─────────────────────────────────────────────────────────────────
export function validateAndRepairJsx(jsx) {
  let validated = jsx;

  // 1. Ensure no nested buttons survived
  validated = preventInvalidNesting(validated);

  // 2. Ensure no negative operator in style object keys (e.g. { -Yt...: ... })
  validated = validated.replace(/style=\{\{\s*-[a-zA-Z]/g, match => {
    return match.replace('-', "'--");
  });

  // 3. Ensure no dangling unclosed custom element tag
  validated = validated.replace(/<\/?(?:yt|ytd|tp-yt)-[a-zA-Z0-9-]+\b[^>]*>/gi, '');

  return validated;
}

// ─────────────────────────────────────────────────────────────────
// JSDoc + Props Helpers
// ─────────────────────────────────────────────────────────────────
function buildPropsJsdoc(data, twClasses) {
  const lines = ['/**', ' * Auto-generated Standalone React Component by Qursor++'];
  if (data.tag)      lines.push(` * @origin  <${data.tag.toLowerCase()}>`);
  if (data.selector) lines.push(` * @selector ${data.selector}`);
  if (twClasses)     lines.push(` * @tailwind ${twClasses}`);
  lines.push(' * @param {string} [className] Extra Tailwind utility classes to merge');
  lines.push(' * @param {React.ReactNode} [children] Child content override');
  lines.push(' */');
  return lines.join('\n');
}

function buildTypedProps(data, avatarProp) {
  const propsList = [];
  if (avatarProp) {
    propsList.push(`avatarUrl = '${avatarProp}'`);
  }
  propsList.push("className = ''");
  const hasChildren = data.general && data.general.textContent && data.general.textContent.trim();
  if (hasChildren) {
    propsList.push('children');
  }
  propsList.push('...props');

  return `{ ${propsList.join(', ')} }`;
}

function sanitizeComponentName(id, classes, tag) {
  let name = 'SelectedComponent';
  if (id && id !== 'N/A') name = toPascalCase(id);
  else if (classes && classes.length > 0) name = toPascalCase(classes[0]);
  else if (tag) name = toPascalCase(tag) + 'Component';
  return name.replace(/[^a-zA-Z0-9]/g, '') || 'Component';
}

function toPascalCase(str) {
  if (!str) return 'Component';
  return str
    .replace(/[-_]/g, ' ')
    .replace(/(?:^|\s)\w/g, m => m.toUpperCase())
    .replace(/\s+/g, '');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function indentCode(str, spaces = 2) {
  if (!str) return '';
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line.trim() ? pad + line : '').join('\n');
}
