/**
 * Qursor++ - Multi-Framework & Isolated Code Generator
 * 
 * Synthesizes production-ready reusable UI components from extracted DOM telemetry.
 * Supports HTML Only, CSS Only, JS Only, HTML+CSS+JS, React JSX, Vue 3 SFC, Angular, and Tailwind.
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
export function generateComponentCode(data, format = CODE_FORMATS.HTML_CSS_JS) {
  if (!data) return '';

  const rawHtml = data.general ? data.general.fullOuterHTML : (data.outerHTML || '');
  const tag = (data.tag || 'DIV').toLowerCase();
  const componentName = sanitizeComponentName(data.general ? data.general.id : null, data.classes, tag);
  const styles = data.styles || {};
  const rawCss = data.rawCss || '';
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
      return generateReactJSX(rawHtml, componentName, rawCss);

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

function sanitizeComponentName(id, classes, tag) {
  let name = 'SelectedComponent';
  if (id && id !== 'N/A') {
    name = toPascalCase(id);
  } else if (classes && classes.length > 0) {
    name = toPascalCase(classes[0]);
  } else if (tag) {
    name = toPascalCase(tag) + 'Component';
  }
  return name.replace(/[^a-zA-Z0-9]/g, '');
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

function generateReactJSX(html, componentName, rawCss) {
  let jsxHtml = html
    .replace(/\bclass=/g, 'className=')
    .replace(/\bfor=/g, 'htmlFor=')
    .replace(/\btabindex=/g, 'tabIndex=')
    .replace(/\bautocomplete=/g, 'autoComplete=')
    .replace(/\breadonly=/g, 'readOnly=')
    .replace(/\bcontenteditable=/g, 'contentEditable=');

  jsxHtml = jsxHtml.replace(/<(img|input|br|hr|meta|link)([^>]*)(?<!\/)>/gi, '<$1$2 />');

  return `import React from 'react';

/**
 * ${componentName} Component
 */
export default function ${componentName}({ className = '', ...props }) {
  return (
    ${indentCode(jsxHtml, 4)}
  );
}`;
}

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

function generateTailwindHTML(html, tailwindClasses) {
  if (!tailwindClasses) return html;
  if (/\bclass="/.test(html)) {
    return html.replace(/\bclass="([^"]*)"/, (match, existing) => `class="${(existing + ' ' + tailwindClasses).trim()}"`);
  } else {
    return html.replace(/^<([a-zA-Z0-9-]+)/, `<$1 class="${tailwindClasses}"`);
  }
}

function indentCode(str, spaces = 2) {
  if (!str) return '';
  const pad = ' '.repeat(spaces);
  return str
    .split('\n')
    .map(line => (line.trim() ? pad + line : ''))
    .join('\n');
}
