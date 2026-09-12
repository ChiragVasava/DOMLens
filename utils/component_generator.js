/**
 * Qursor++ - Multi-Framework & Isolated Code Generator
 *
 * Synthesizes production-ready reusable UI components from extracted DOM telemetry.
 * Supports HTML Only, React JSX (with Tailwind CSS), and Angular.
 */

import { mapStylesToTailwind } from './tailwind_mapper.js';

export const CODE_FORMATS = {
  HTML_ONLY: 'html_only',
  CSS_ONLY: 'css_only',
  JS_ONLY: 'js_only',
  HTML_CSS_JS: 'html_css_js',
  REACT: 'react',
  VUE: 'vue',
  ANGULAR: 'angular',
  TAILWIND: 'tailwind'
};

/**
 * Main component generator dispatch function
 * @param {Object} data Element inspection payload
 * @param {string} format Target format key
 * @returns {string} Formatted code snippet
 */
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
      return rawCss || `/* Computed CSS for <${tag}> */\n.${componentName.toLowerCase()} {\n  display: ${styles.layout ? styles.layout.display : 'block'};\n}`;

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

// ─────────────────────────────────────────────────────────
// Helper: sanitize component name
// ─────────────────────────────────────────────────────────
function sanitizeComponentName(id, classes, tag) {
  let name = 'SelectedComponent';
  if (id && id !== 'N/A') {
    name = toPascalCase(id);
  } else if (classes && classes.length > 0) {
    name = toPascalCase(classes[0]);
  } else if (tag) {
    name = toPascalCase(tag) + 'Component';
  }
  return name.replace(/[^a-zA-Z0-9]/g, '') || 'Component';
}

function toPascalCase(str) {
  if (!str) return 'Component';
  return str
    .replace(/[-_]/g, ' ')
    .replace(/(?:^|\s)\w/g, match => match.toUpperCase())
    .replace(/\s+/g, '');
}

function cleanHtmlSnippet(html) {
  if (!html) return '';
  return html.trim();
}

// ─────────────────────────────────────────────────────────
// HTML-only
// ─────────────────────────────────────────────────────────
function generateJsOnly(componentName, tag) {
  return `/**
 * ${componentName} Interactive Logic
 * Target Tag: <${tag}>
 */
document.addEventListener('DOMContentLoaded', () => {
  const element = document.querySelector('.${componentName.toLowerCase()}');
  if (element) {
    element.addEventListener('click', (e) => {
      console.log('[Qursor++] ${componentName} clicked:', e.target);
    });
  }
});`;
}

function generateVanillaBundle(html, componentName, rawCss) {
  const className = componentName.toLowerCase();
  return `<!-- ${componentName} HTML -->
<div class="${className}">
${indentCode(html, 2)}
</div>

<style>
/* ${componentName} Styles */
.${className} {
${indentCode(rawCss, 2)}
}
</style>

<script>
// ${componentName} Interaction
document.addEventListener('DOMContentLoaded', () => {
  const target = document.querySelector('.${className}');
  if (target) {
    console.log('[${componentName}] Component ready.');
  }
});
</script>`;
}

// ─────────────────────────────────────────────────────────
// React + Tailwind CSS Generator
// ─────────────────────────────────────────────────────────

/**
 * Convert raw HTML into clean JSX:
 * - class → className
 * - for → htmlFor
 * - HTML attributes → camelCase JSX equivalents
 * - self-close void elements
 * - Replace style="..." strings with Tailwind className where possible
 * - Inject Tailwind classes from computed styles
 */
function generateReactTailwind(rawHtml, componentName, styles, tailwindClasses, data) {
  if (!rawHtml) {
    return buildEmptyReactComponent(componentName, tailwindClasses);
  }

  // Step 1: Convert HTML attributes to JSX equivalents
  let jsxBody = htmlToJsx(rawHtml);

  // Step 2: Inject Tailwind classes onto the ROOT element.
  //         If root already has className, merge. Otherwise add it.
  if (tailwindClasses) {
    jsxBody = injectTailwindOnRoot(jsxBody, tailwindClasses);
  }

  // Step 3: Build the component
  const tag         = (data.tag || 'div').toLowerCase();
  const propsBlock  = buildPropsJsdoc(data, tailwindClasses);
  const typedProps  = buildTypedProps(data);

  return `import React from 'react';

${propsBlock}
export default function ${componentName}(${typedProps}) {
  return (
${indentCode(jsxBody, 4)}
  );
}`;
}

/** Build an empty component shell when no HTML is available */
function buildEmptyReactComponent(name, tailwindClasses) {
  return `import React from 'react';

export default function ${name}({ className = '', children }) {
  return (
    <div className={\`${tailwindClasses} \${className}\`}>
      {children}
    </div>
  );
}`;
}

/**
 * Convert an HTML string to JSX:
 * 1. HTML attributes → JSX equivalents
 * 2. Self-close void elements
 * 3. Inline style="..." → style={{ ... }} objects
 */
function htmlToJsx(html) {
  if (!html) return '';

  let jsx = html;

  // Attribute renames (must be done before general processing)
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
    'controls':         'controls',
    'muted':            'muted',
  };

  Object.entries(attrMap).forEach(([from, to]) => {
    // Use regex with word boundary to avoid partial replacements
    jsx = jsx.replace(new RegExp(`\\b${escapeRegex(from)}`, 'g'), to);
  });

  // Convert inline style="..." to style={{ key: 'value', ... }}
  jsx = jsx.replace(/\bstyle="([^"]*)"/g, (_, cssText) => {
    const obj = cssStringToJsxStyleObj(cssText);
    return `style={${obj}}`;
  });

  // Self-close void HTML elements
  const voidEls = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base',
                   'col', 'embed', 'param', 'source', 'track', 'wbr'];
  voidEls.forEach(el => {
    // Match <el ...> without existing />
    jsx = jsx.replace(
      new RegExp(`<(${el})(\\s[^>]*)?(?<!/)>`, 'gi'),
      (_, tag, attrs) => `<${tag}${attrs || ''} />`
    );
  });

  // Fix double-space from self-closing additions
  jsx = jsx.replace(/ {2,}\/>/g, ' />');

  return jsx.trim();
}

/**
 * Convert CSS text "color: red; font-size: 14px" → "{{ color: 'red', fontSize: '14px' }}"
 */
function cssStringToJsxStyleObj(cssText) {
  if (!cssText || !cssText.trim()) return '{}';
  const pairs = cssText.split(';').map(s => s.trim()).filter(Boolean);
  const entries = pairs.map(pair => {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) return null;
    const prop  = pair.slice(0, colonIdx).trim();
    const value = pair.slice(colonIdx + 1).trim();
    if (!prop || !value) return null;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    // Escape inner quotes
    const safeVal = value.replace(/'/g, "\\'");
    return `${camel}: '${safeVal}'`;
  }).filter(Boolean);

  if (!entries.length) return '{}';
  return `{ ${entries.join(', ')} }`;
}

/**
 * Inject Tailwind classes onto the FIRST element tag in the JSX.
 * If it already has className="..." → append.
 * If it has className={...}  → wrap in template literal.
 * If no className at all     → insert one.
 */
function injectTailwindOnRoot(jsx, twClasses) {
  if (!twClasses) return jsx;

  // Case 1: className="existing classes"
  if (/className="([^"]*)"/.test(jsx)) {
    return jsx.replace(/className="([^"]*)"/, (_, existing) => {
      const merged = (existing + ' ' + twClasses).trim();
      return `className="${merged}"`;
    });
  }

  // Case 2: className={expr} — wrap in template literal
  if (/className=\{/.test(jsx)) {
    return jsx.replace(/className=\{([^}]*)\}/, (_, expr) => {
      return `className={\`${twClasses} \${${expr.trim()}}\`}`;
    });
  }

  // Case 3: No className — inject after first tag name
  return jsx.replace(/^<([a-zA-Z][a-zA-Z0-9-]*)(\s|>)/, (_, tagName, after) => {
    return `<${tagName} className="${twClasses}"${after}`;
  });
}

/** Build a JSDoc comment block describing the component props */
function buildPropsJsdoc(data, twClasses) {
  const lines = ['/**'];
  lines.push(` * Auto-generated React component by Qursor++`);
  if (data.tag)       lines.push(` * @origin HTML <${data.tag.toLowerCase()}>`);
  if (data.selector)  lines.push(` * @selector ${data.selector}`);
  if (twClasses)      lines.push(` * @tailwind ${twClasses}`);
  lines.push(` * @param {string}  [className]  Extra Tailwind classes to merge`);
  lines.push(` * @param {React.ReactNode} [children]  Child content override`);
  lines.push(' */');
  return lines.join('\n');
}

/** Build the props destructure string for the function signature */
function buildTypedProps(data) {
  const hasChildren = (data.general && data.general.textContent && data.general.textContent.trim());
  if (hasChildren) {
    return '{ className = \'\', children, ...props }';
  }
  return '{ className = \'\', ...props }';
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────
// Vue SFC
// ─────────────────────────────────────────────────────────
function generateVueSFC(html, componentName, rawCss) {
  return `<template>
${indentCode(html, 2)}
</template>

<script setup>
// ${componentName} Component
</script>

<style scoped>
${rawCss || '/* Component styles */'}
</style>`;
}

// ─────────────────────────────────────────────────────────
// Angular Component
// ─────────────────────────────────────────────────────────
function generateAngularComponent(html, componentName, rawCss) {
  const selector = 'app-' + componentName.toLowerCase();
  return `import { Component } from '@angular/core';

@Component({
  selector: '${selector}',
  standalone: true,
  template: \`
${indentCode(html, 4)}
  \`,
  styles: [\`
${indentCode(rawCss, 4)}
  \`]
})
export class ${componentName}Component {}`;
}

// ─────────────────────────────────────────────────────────
// Tailwind HTML
// ─────────────────────────────────────────────────────────
function generateTailwindHTML(html, tailwindClasses) {
  if (!tailwindClasses) return html;
  if (/\bclass="/.test(html)) {
    return html.replace(/\bclass="([^"]*)"/, (match, existing) =>
      `class="${(existing + ' ' + tailwindClasses).trim()}"`
    );
  } else {
    return html.replace(/^<([a-zA-Z0-9-]+)/, `<$1 class="${tailwindClasses}"`);
  }
}

// ─────────────────────────────────────────────────────────
// Shared utility
// ─────────────────────────────────────────────────────────
function indentCode(str, spaces = 2) {
  if (!str) return '';
  const pad = ' '.repeat(spaces);
  return str
    .split('\n')
    .map(line => (line.trim() ? pad + line : ''))
    .join('\n');
}
