/**
 * Qursor++ - Multi-Framework & Isolated Code Generator
 *
 * Synthesizes production-ready reusable UI components from extracted DOM telemetry.
 * Supports HTML Only, React JSX (with Tailwind CSS), Angular.
 *
 * React generation pipeline:
 *  1. sanitizeHtmlForReact  — strip comments, map custom elements, drop Polymer attrs, dedup IDs
 *  2. htmlToJsx             — class→className, style→JSX object, self-close void elements
 *  3. injectTailwindOnRoot  — inject computed Tailwind classes on root element
 *  4. wrap in component     — JSDoc + functional component shell
 */

import { mapStylesToTailwind } from './tailwind_mapper.js';

export const CODE_FORMATS = {
  HTML_ONLY:   'html_only',
  CSS_ONLY:    'css_only',
  JS_ONLY:     'js_only',
  HTML_CSS_JS: 'html_css_js',
  REACT:       'react',
  VUE:         'vue',
  ANGULAR:     'angular',
  TAILWIND:    'tailwind'
};

// ─────────────────────────────────────────────────────────────────
// Custom Web Component → Standard HTML element map
// Any ytd-* / yt-* / tp-yt-* not listed falls back to div/span/div
// A value of null means "strip the element entirely (ripple/internal)"
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
  'ytd-thumbnail-overlay-toggle-button-renderer': 'button',
  'ytd-thumbnail-overlay-time-status-renderer':   'span',
  'ytd-badge-supported-renderer':           'span',
  'ytd-button-renderer':                    'div',
  'ytd-toggle-button-renderer':             'button',
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
  'yt-icon-button':                         'button',
  'yt-chip-cloud-renderer':                 'div',
  'yt-chip-cloud-chip-renderer':            'button',
  'yt-spec-button-shape':                   'button',
  'yt-touch-feedback-shape':                null,  // visual ripple — strip
  'yt-interaction':                         null,  // visual ripple — strip

  // ── Polymer / Paper (tp-yt-*) ──
  'tp-yt-paper-item':                       'div',
  'tp-yt-paper-button':                     'button',
  'tp-yt-paper-dialog':                     'dialog',
  'tp-yt-paper-listbox':                    'ul',
  'tp-yt-paper-tooltip':                    'div',
  'tp-yt-iron-list':                        'div',
  'tp-yt-app-toast':                        'div',
  'tp-yt-paper-spinner':                    'div',
  'tp-yt-paper-progress':                   'div',
  'tp-yt-paper-tabs':                       'div',
  'tp-yt-paper-tab':                        'button',
};

// Polymer / Web-Component-specific attributes that have no meaning in React
const POLYMER_ATTRS = [
  'guide-persistent-and-visible',
  'is-header', 'is-primary', 'is-empty', 'is-focused',
  'style-target', 'disable-upgrade', 'link-inherit-color',
  'can-show-more', 'loaded', 'focused', 'animated',
  'elevation', 'line-end-style', 'no-transition',
  'css-build', 'apply-shim-no-shimming',
];

// ─────────────────────────────────────────────────────────────────
// Main dispatcher
// ─────────────────────────────────────────────────────────────────
export function generateComponentCode(data, format = CODE_FORMATS.HTML_ONLY) {
  if (!data) return '';

  const rawHtml   = data.general ? data.general.fullOuterHTML : (data.outerHTML || '');
  const tag       = (data.tag || 'DIV').toLowerCase();
  const styles    = data.styles || {};
  const rawCss    = data.rawCss || '';
  const componentName = sanitizeComponentName(
    data.general ? data.general.id : null,
    data.classes,
    tag
  );
  const tailwindClasses = mapStylesToTailwind(styles, tag);

  switch (format.toLowerCase()) {
    case CODE_FORMATS.HTML_ONLY:
      return cleanHtmlSnippet(rawHtml);

    case CODE_FORMATS.CSS_ONLY:
      return rawCss ||
        `/* Computed CSS for <${tag}> */\n.${componentName.toLowerCase()} {\n  display: ${(styles.layout || {}).display || 'block'};\n}`;

    case CODE_FORMATS.JS_ONLY:
      return generateJsOnly(componentName, tag);

    case CODE_FORMATS.HTML_CSS_JS:
      return generateVanillaBundle(rawHtml, componentName, rawCss);

    case CODE_FORMATS.REACT:
      return generateReactTailwind(rawHtml, componentName, styles, tailwindClasses, data);

    case CODE_FORMATS.VUE:
      return generateVueSFC(rawHtml, componentName, rawCss);

    case CODE_FORMATS.ANGULAR:
      return generateAngularComponent(rawHtml, componentName, rawCss);

    case CODE_FORMATS.TAILWIND:
      return generateTailwindHTML(rawHtml, tailwindClasses);

    default:
      return generateVanillaBundle(rawHtml, componentName, rawCss);
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
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

function cleanHtmlSnippet(html) {
  return html ? html.trim() : '';
}

// ─────────────────────────────────────────────────────────────────
// Vanilla HTML+CSS+JS bundle
// ─────────────────────────────────────────────────────────────────
function generateJsOnly(componentName, tag) {
  return `/**\n * ${componentName} — Interactive Logic\n * Target: <${tag}>\n */\ndocument.addEventListener('DOMContentLoaded', () => {\n  const el = document.querySelector('.${componentName.toLowerCase()}');\n  if (el) el.addEventListener('click', e => console.log('[${componentName}]', e.target));\n});`;
}

function generateVanillaBundle(html, componentName, rawCss) {
  const cls = componentName.toLowerCase();
  return `<!-- ${componentName} -->\n<div class="${cls}">\n${indentCode(html, 2)}\n</div>\n\n<style>\n.${cls} {\n${indentCode(rawCss, 2)}\n}\n</style>\n\n<script>\ndocument.addEventListener('DOMContentLoaded', () => {\n  const el = document.querySelector('.${cls}');\n  if (el) console.log('[${componentName}] ready');\n});\n</script>`;
}

// ─────────────────────────────────────────────────────────────────
// ██████╗ ███████╗ █████╗  ██████╗████████╗
// ██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝
// ██████╔╝█████╗  ███████║██║        ██║
// ██╔══██╗██╔══╝  ██╔══██║██║        ██║
// ██║  ██║███████╗██║  ██║╚██████╗   ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ╚═╝
// React + Tailwind CSS Generator
// ─────────────────────────────────────────────────────────────────

function generateReactTailwind(rawHtml, componentName, styles, tailwindClasses, data) {
  if (!rawHtml) return buildEmptyReactComponent(componentName, tailwindClasses);

  // Step 1: Sanitize HTML → clean semantic HTML (strips custom elements, comments, Polymer attrs)
  const cleanHtml = sanitizeHtmlForReact(rawHtml);

  // Step 2: HTML → JSX (attribute renames, style objects, self-close voids)
  let jsxBody = htmlToJsx(cleanHtml);

  // Step 3: Inject Tailwind classes onto root element
  if (tailwindClasses) {
    jsxBody = injectTailwindOnRoot(jsxBody, tailwindClasses);
  }

  // Step 4: Wrap in component
  const propsBlock = buildPropsJsdoc(data, tailwindClasses);
  const typedProps  = buildTypedProps(data);

  return `import React from 'react';

${propsBlock}
export default function ${componentName}(${typedProps}) {
  return (
${indentCode(jsxBody, 4)}
  );
}`;
}

function buildEmptyReactComponent(name, twClasses) {
  return `import React from 'react';\n\nexport default function ${name}({ className = '', children }) {\n  return (\n    <div className={\`${twClasses} \${className}\`}>\n      {children}\n    </div>\n  );\n}`;
}

// ─────────────────────────────────────────────────────────────────
// Step 1: sanitizeHtmlForReact
//   Fixes bugs 1-5 from the analysis:
//   1. Custom Web Components → standard HTML
//   2. HTML comments stripped
//   3. Duplicate IDs removed
//   4. Polymer attrs stripped
//   5. JSON blobs in attributes cleaned up
// ─────────────────────────────────────────────────────────────────
function sanitizeHtmlForReact(html) {
  if (!html) return '';
  let h = html;

  // ── FIX 2: Strip ALL HTML comments (<!-- ... -->) ──────────────
  // These cause JSX parse errors
  h = h.replace(/<!--[\s\S]*?-->/g, '');

  // ── FIX 1: Strip null-mapped elements (ripple/internal) ────────
  // e.g. <yt-interaction>...</yt-interaction> → removed entirely
  Object.entries(CUSTOM_ELEMENT_MAP).forEach(([tag, mapped]) => {
    if (mapped === null) {
      // Strip element + all its children
      h = h.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
      // Also strip self-closing variant
      h = h.replace(new RegExp(`<${tag}[^>]*/>`, 'gi'), '');
    }
  });

  // ── FIX 1: Replace known custom elements with standard HTML ─────
  Object.entries(CUSTOM_ELEMENT_MAP).forEach(([customTag, htmlTag]) => {
    if (htmlTag === null) return; // already handled above
    // Opening tag (with or without attrs)
    h = h.replace(
      new RegExp(`<(${customTag})(\\s[^>]*)?>`, 'gi'),
      (_, _t, attrs) => `<${htmlTag}${attrs || ''}>`
    );
    // Closing tag
    h = h.replace(new RegExp(`<\\/${customTag}>`, 'gi'), `</${htmlTag}>`);
  });

  // ── FIX 1b: Generic fallback for remaining custom elements ──────
  // Any ytd-* not in the map → <div>
  h = h.replace(/<(ytd-[\w-]+)(\s[^>]*)?>/gi,  (_, _t, attrs) => `<div${attrs || ''}>`);
  h = h.replace(/<\/(ytd-[\w-]+)>/gi, '</div>');
  // Any yt-* not in the map → <span>
  h = h.replace(/<(yt-[\w-]+)(\s[^>]*)?>/gi,   (_, _t, attrs) => `<span${attrs || ''}>`);
  h = h.replace(/<\/(yt-[\w-]+)>/gi, '</span>');
  // Any tp-yt-* not in the map → <div>
  h = h.replace(/<(tp-yt-[\w-]+)(\s[^>]*)?>/gi, (_, _t, attrs) => `<div${attrs || ''}>`);
  h = h.replace(/<\/(tp-yt-[\w-]+)>/gi, '</div>');

  // ── FIX 4 & 5: Strip Polymer-specific attributes ────────────────
  // Handles: attr, attr="...", attr={...}, attr='...'
  POLYMER_ATTRS.forEach(attr => {
    h = h.replace(
      new RegExp(`\\s${escapeRegex(attr)}(=("[^"]*"|'[^']*'|\\{[^}]*\\}))?`, 'gi'),
      ''
    );
  });

  // Strip any remaining attribute whose value is a JSON/HTML-entity blob
  // e.g.  disable-upgrade="{&quot;thumbnails&quot;:[...]}"
  h = h.replace(/\s[\w-]+="\{&quot;[\s\S]*?\}"/gi, '');
  h = h.replace(/\s[\w-]+='\{&apos;[\s\S]*?\}'/gi, '');

  // ── FIX 3: Remove duplicate id attributes ──────────────────────
  // Keep first occurrence, strip repeats
  const seenIds = new Set();
  h = h.replace(/\bid="([^"]*)"/g, (match, id) => {
    if (!id || seenIds.has(id)) return ''; // drop duplicate
    seenIds.add(id);
    return match;
  });

  // ── Cleanup: collapse excessive blank lines ──────────────────────
  h = h.replace(/\n{3,}/g, '\n\n');
  h = h.replace(/>\s+</g, '>\n<'); // normalize whitespace between tags

  return h.trim();
}

// ─────────────────────────────────────────────────────────────────
// Step 2: htmlToJsx
//   Fixes bug 6: className on converted-standard elements is correct.
//   Converts HTML attribute names → JSX equivalents.
//   Converts style="..." → style={{ jsxObject }}
//   Self-closes void elements.
// ─────────────────────────────────────────────────────────────────
function htmlToJsx(html) {
  if (!html) return '';
  let jsx = html;

  // HTML attribute → JSX attribute renames
  const attrMap = {
    'class=':           'className=',
    'for=':             'htmlFor=',
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
  };
  Object.entries(attrMap).forEach(([from, to]) => {
    jsx = jsx.replace(new RegExp(`\\b${escapeRegex(from)}`, 'gi'), to);
  });

  // Decode HTML entities in attribute values that slipped through
  jsx = jsx.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'");

  // Convert inline style="..." → style={{ camelCase: 'value' }}
  jsx = jsx.replace(/\bstyle="([^"]*)"/g, (_, cssText) => `style={${cssStringToJsxStyleObj(cssText)}}`);

  // Self-close void HTML elements
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
// e.g. "color: red; font-size: 14px" → "{ color: 'red', fontSize: '14px' }"
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
      const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `${camel}: '${value.replace(/'/g, "\\'")}'`;
    }).filter(Boolean);
  return entries.length ? `{ ${entries.join(', ')} }` : '{}';
}

// ─────────────────────────────────────────────────────────────────
// Step 3: Inject Tailwind classes onto root element
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
// Step 4: JSDoc + props helpers
// ─────────────────────────────────────────────────────────────────
function buildPropsJsdoc(data, twClasses) {
  const lines = ['/**', ' * Auto-generated React component by Qursor++'];
  if (data.tag)      lines.push(` * @origin  <${data.tag.toLowerCase()}>`);
  if (data.selector) lines.push(` * @selector ${data.selector}`);
  if (twClasses)     lines.push(` * @tailwind ${twClasses}`);
  lines.push(' * @param {string} [className]  Extra Tailwind classes to merge');
  lines.push(' * @param {React.ReactNode} [children]  Child content override');
  lines.push(' */');
  return lines.join('\n');
}

function buildTypedProps(data) {
  const hasChildren = data.general && data.general.textContent && data.general.textContent.trim();
  return hasChildren ? "{ className = '', children, ...props }" : "{ className = '', ...props }";
}

// ─────────────────────────────────────────────────────────────────
// Vue SFC
// ─────────────────────────────────────────────────────────────────
function generateVueSFC(html, componentName, rawCss) {
  return `<template>\n${indentCode(html, 2)}\n</template>\n\n<script setup>\n// ${componentName}\n</script>\n\n<style scoped>\n${rawCss || '/* styles */'}\n</style>`;
}

// ─────────────────────────────────────────────────────────────────
// Angular
// ─────────────────────────────────────────────────────────────────
function generateAngularComponent(html, componentName, rawCss) {
  const sel = 'app-' + componentName.toLowerCase();
  return `import { Component } from '@angular/core';\n\n@Component({\n  selector: '${sel}',\n  standalone: true,\n  template: \`\n${indentCode(html, 4)}\n  \`,\n  styles: [\`\n${indentCode(rawCss, 4)}\n  \`]\n})\nexport class ${componentName}Component {}`;
}

// ─────────────────────────────────────────────────────────────────
// Tailwind HTML
// ─────────────────────────────────────────────────────────────────
function generateTailwindHTML(html, tailwindClasses) {
  if (!tailwindClasses) return html;
  return /\bclass="/.test(html)
    ? html.replace(/\bclass="([^"]*)"/, (_, e) => `class="${(e + ' ' + tailwindClasses).trim()}"`)
    : html.replace(/^<([a-zA-Z0-9-]+)/, `<$1 class="${tailwindClasses}"`);
}

// ─────────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function indentCode(str, spaces = 2) {
  if (!str) return '';
  const pad = ' '.repeat(spaces);
  return str.split('\n').map(line => line.trim() ? pad + line : '').join('\n');
}
