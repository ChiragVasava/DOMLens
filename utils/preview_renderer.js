/**
 * Qursor++ - Isolated Live Preview Renderer
 * 
 * Compiles authoritative current HTML + current CSS into an isolated sandboxed preview document.
 * Enforces Canvas vs Component background isolation:
 * - Dark Mode Canvas:  #000000
 * - Light Mode Canvas: #FFFFFF
 * - Preserves any explicit component background (never overwrites inline/class backgrounds).
 * - Prevents extension UI variables (--q-*) from leaking into the preview.
 */

/**
 * Builds an isolated preview document string for iframe srcdoc
 * @param {string} html Authoritative component HTML
 * @param {string} css Authoritative component CSS rules
 * @param {Object} options Configuration options
 * @param {string} [options.theme='dark'] Extension/Canvas theme ('dark' | 'light')
 * @param {number} [options.zoom=1.0] Zoom scale factor
 * @param {number} [options.width=400] Target element width
 * @param {number} [options.height=300] Target element height
 * @returns {string} Fully isolated HTML document string
 */
export function buildLivePreviewDoc(html, css, options = {}) {
  const theme = options.theme || 'dark';
  const zoom = typeof options.zoom === 'number' ? options.zoom : 1.0;
  const targetWidth = (options.width && options.width > 20) ? Math.round(options.width) : null;

  // Canvas theme background (surrounds component)
  const canvasBg = theme === 'dark' ? '#000000' : '#FFFFFF';
  // Default canvas text color only applies to canvas container as fallback, without overriding component
  const canvasTextColor = theme === 'dark' ? '#f5f5f7' : '#1d1d1f';

  // Ensure table/list fragments are valid in isolation
  let safeHtml = (html || '').trim();
  const trimmed = safeHtml.toLowerCase();
  if (trimmed.startsWith('<td') || trimmed.startsWith('<th')) {
    safeHtml = `<table style="border-collapse:collapse;width:100%;"><tbody><tr>${safeHtml}</tr></tbody></table>`;
  } else if (trimmed.startsWith('<tr')) {
    safeHtml = `<table style="border-collapse:collapse;width:100%;"><tbody>${safeHtml}</tbody></table>`;
  } else if (trimmed.startsWith('<li')) {
    safeHtml = `<ul style="margin:0;padding:0 0 0 20px;list-style:disc;">${safeHtml}</ul>`;
  }

  const widthStyle = targetWidth ? `width:${targetWidth}px;` : 'width:max-content;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* ── Isolated Canvas Surface ── */
    html {
      margin: 0;
      padding: 0;
      background-color: ${canvasBg};
      color: ${canvasTextColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      overflow: auto;
    }
    body {
      margin: 0;
      padding: 16px;
      min-height: 100vh;
      box-sizing: border-box;
      background-color: ${canvasBg};
      color: inherit;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: auto;
    }
    
    /* ── Component Canvas Anchor & Zoom ── */
    #preview-root {
      ${widthStyle}
      transform: scale(${zoom});
      transform-origin: top center;
      transition: transform 0.1s ease-out;
      box-sizing: border-box;
      margin: 0 auto;
    }

    /* ── Component Scoped CSS ── */
    ${css || ''}
  </style>
</head>
<body>
  <div id="preview-root">
    ${safeHtml}
  </div>
</body>
</html>`;
}

export const renderComponentPreview = buildLivePreviewDoc;
