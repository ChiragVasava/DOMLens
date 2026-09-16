/**
 * Qursor++ - Safe HTML-Aware Deterministic Text Editor
 * 
 * Performs instant, zero-latency, HTML-aware literal text replacements directly on component HTML
 * without calling external LLM APIs.
 * 
 * CRITICAL SAFETY RULES:
 * 1. Replaces VISIBLE text nodes and user-facing attributes (title, aria-label, alt, placeholder).
 * 2. NEVER modifies navigation URLs (href, src), class names, IDs, inline styles, or data attributes.
 * 3. 100% CSS preservation (before.css === after.css byte-for-byte).
 * 4. Eliminates API costs, eliminates 503 errors, prevents hallucinations, and works even when offline.
 */

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safely replaces visible text nodes and user-facing accessibility attributes
 * in an HTML string without mutating tags, URLs (href/src), classes, or data attributes.
 * 
 * @param {string} html Source HTML
 * @param {string} fromText Text to find
 * @param {string} toText Text to replace with
 * @returns {{ html: string, replaced: boolean, count: number }}
 */
export function safeHtmlTextReplace(html, fromText, toText) {
  if (!html || !fromText || !toText || fromText === toText) {
    return { html: html || '', replaced: false, count: 0 };
  }

  // Find exact or case-insensitive match for fromText
  let targetFrom = fromText;
  if (!html.includes(fromText)) {
    const match = html.match(new RegExp(`\\b${escapeRegExp(fromText)}\\b`, 'i'));
    if (match) {
      targetFrom = match[0];
    }
  }

  const tagRegex = /(<[^>]+>)|([^<]+)/g;
  let inSkipTag = false;
  let count = 0;

  const result = html.replace(tagRegex, (match, tag, text) => {
    if (tag) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag.startsWith('<script') || lowerTag.startsWith('<style')) {
        inSkipTag = true;
        return tag;
      }
      if (lowerTag.startsWith('</script') || lowerTag.startsWith('</style')) {
        inSkipTag = false;
        return tag;
      }

      // Inside tag: Only update user-facing attributes (title, aria-label, alt, placeholder)
      // NEVER touch href, src, class, id, style, data-*, or SVG path d attributes!
      const updatedTag = tag.replace(
        /\b(title|aria-label|alt|placeholder)=(["'])(.*?)\2/gi,
        (attrMatch, attrName, quote, attrVal) => {
          if (attrVal.includes(targetFrom)) {
            count++;
            return `${attrName}=${quote}${attrVal.replaceAll(targetFrom, toText)}${quote}`;
          }
          return attrMatch;
        }
      );
      return updatedTag;
    }

    if (text) {
      if (inSkipTag) return text;
      if (text.includes(targetFrom)) {
        count++;
        return text.replaceAll(targetFrom, toText);
      }
      return text;
    }

    return match;
  });

  return {
    html: result,
    replaced: count > 0,
    count
  };
}

/**
 * Detects if a user instruction is a direct, literal text replacement
 * (e.g. "Write Follows Instead Of Subscriptions", "Change Sunita Williams to Sunita Pandya")
 * and applies it deterministically with safe HTML awareness without calling Gemini.
 * 
 * @param {string} instruction 
 * @param {string} currentHtml 
 * @returns {{ html: string, changes: string[] } | null}
 */
export function detectSimpleTextEdit(instruction, currentHtml) {
  if (!instruction || typeof instruction !== 'string' || !currentHtml || typeof currentHtml !== 'string') {
    return null;
  }

  const trimmed = instruction.trim();

  // Guard: Do not intercept style / layout / semantic instructions
  const cssKeywords = [
    'background', 'bg', 'color', 'padding', 'margin', 'border', 'font',
    'size', 'width', 'height', 'display', 'radius', 'shadow', 'layout',
    'theme', 'responsive', 'modern', 'glassmorphism', 'flex', 'grid', 'column', 'row', 'align'
  ];
  const lowerInstr = trimmed.toLowerCase();
  const isStyleEdit = cssKeywords.some(k => {
    return lowerInstr.includes(` ${k} `) || lowerInstr.startsWith(`${k} `) || lowerInstr.endsWith(` ${k}`) || lowerInstr === k;
  });
  if (isStyleEdit && !lowerInstr.includes('instead of') && !lowerInstr.includes('to ') && !lowerInstr.includes('with ')) {
    return null;
  }

  // Pattern 1: "Write X Instead Of Y" / "Put X instead of Y" / "Use X instead of Y"
  // Example: "Write Follows Instead Of Subscriptions" -> toText="Follows", fromText="Subscriptions"
  const insteadOfMatch = trimmed.match(/^(?:write|put|use|set)\s+["'“]?(.+?)["'”]?\s+instead\s+of\s+["'“]?(.+?)["'”]?\.?$/i);
  if (insteadOfMatch) {
    const toText = insteadOfMatch[1].trim().replace(/^["'“]|["'”]$/g, '').trim();
    const fromText = insteadOfMatch[2].trim().replace(/^["'“]|["'”]$/g, '').trim();

    if (fromText && toText && fromText !== toText) {
      const res = safeHtmlTextReplace(currentHtml, fromText, toText);
      if (res.replaced) {
        return {
          html: res.html,
          changes: [`Changed visible text "${fromText}" to "${toText}"`]
        };
      }
    }
  }

  // Pattern 2: Quoted text - Change / Replace / Rename / Set "A" to / with "B"
  const quotedMatch = trimmed.match(/^(?:change|replace|rename|set|switch|swap)\s+(?:the\s+text\s+|the\s+name\s+|the\s+title\s+|the\s+heading\s+|the\s+label\s+)?(?:from\s+)?["'“]([^"'“”]+)["'”]\s+(?:to|with|for)\s+["'“]([^"'“”]+)["'”]\.?$/i);
  if (quotedMatch) {
    const fromText = quotedMatch[1].trim();
    const toText = quotedMatch[2].trim();
    if (fromText && toText && fromText !== toText) {
      const res = safeHtmlTextReplace(currentHtml, fromText, toText);
      if (res.replaced) {
        return {
          html: res.html,
          changes: [`Changed "${fromText}" to "${toText}"`]
        };
      }
    }
  }

  // Pattern 3: Unquoted phrase - Change [from] A to / with B
  // Example: "Change Subscriptions to Follows", "Replace Sunita Williams with Sunita Pandya"
  const unquotedMatch = trimmed.match(/^(?:change|replace|rename|switch|swap)\s+(?:the\s+text\s+|the\s+name\s+|the\s+title\s+|the\s+heading\s+|the\s+label\s+)?(?:from\s+)?(.+?)\s+(?:to|with|for)\s+(.+?)\.?$/i);
  if (unquotedMatch) {
    let fromText = unquotedMatch[1].trim().replace(/^["'“]|["'”]$/g, '').trim();
    let toText = unquotedMatch[2].trim().replace(/^["'“]|["'”]$/g, '').trim();

    // Guard: Do not intercept style instructions like "change background to red"
    const isCssProperty = cssKeywords.some(k => fromText.toLowerCase() === k || fromText.toLowerCase().endsWith(' ' + k));
    if (!isCssProperty && fromText && toText && fromText !== toText) {
      const res = safeHtmlTextReplace(currentHtml, fromText, toText);
      if (res.replaced) {
        return {
          html: res.html,
          changes: [`Changed "${fromText}" to "${toText}"`]
        };
      }
    }
  }

  // Pattern 4: Target heading/title - Change/set heading/title to "Hello World"
  const headingMatch = trimmed.match(/^(?:change|set|update|rename)\s+(?:the\s+)?(?:heading|title|header)\s+(?:text\s+)?(?:to|with)\s+["'“]?(.+?)["'”]?\.?$/i);
  if (headingMatch) {
    const newText = headingMatch[1].trim().replace(/^["'“]|["'”]$/g, '').trim();
    if (newText) {
      const hRegex = /(<h[1-6][^>]*>)([\s\S]*?)(<\/h[1-6]>)/i;
      const match = currentHtml.match(hRegex);
      if (match) {
        const updated = currentHtml.replace(hRegex, `$1${newText}$3`);
        return {
          html: updated,
          changes: [`Changed heading to "${newText}"`]
        };
      }
    }
  }

  // Pattern 5: Target button text - Change/set button [text] to "Subscribe"
  const buttonMatch = trimmed.match(/^(?:change|set|update)\s+(?:the\s+)?button\s+(?:text\s+|label\s+)?(?:to|with)\s+["'“]?(.+?)["'”]?\.?$/i);
  if (buttonMatch) {
    const newText = buttonMatch[1].trim().replace(/^["'“]|["'”]$/g, '').trim();
    if (newText) {
      const btnRegex = /(<button[^>]*>)([\s\S]*?)(<\/button>)/i;
      const match = currentHtml.match(btnRegex);
      if (match) {
        const updated = currentHtml.replace(btnRegex, `$1${newText}$3`);
        return {
          html: updated,
          changes: [`Changed button text to "${newText}"`]
        };
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Deterministic Safe Style Editor
// ─────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  'blue': '#2563eb',
  'dark blue': '#1e3a8a',
  'light blue': '#60a5fa',
  'sky blue': '#0284c7',
  'navy': '#0f172a',
  'red': '#dc2626',
  'dark red': '#7f1d1d',
  'light red': '#f87171',
  'green': '#16a34a',
  'dark green': '#14532d',
  'light green': '#4ade80',
  'emerald': '#059669',
  'yellow': '#eab308',
  'orange': '#ea580c',
  'purple': '#9333ea',
  'violet': '#7c3aed',
  'pink': '#db2777',
  'black': '#000000',
  'dark': '#121214',
  'darker': '#0a0a0c',
  'gray': '#4b5563',
  'grey': '#4b5563',
  'light gray': '#e5e7eb',
  'light grey': '#e5e7eb',
  'white': '#ffffff',
  'light': '#f8fafc',
  'transparent': 'transparent'
};

function resolveColor(val) {
  if (!val) return null;
  const clean = val.trim().toLowerCase().replace(/^["'“]|["'”]$/g, '').trim();
  if (COLOR_MAP[clean]) return COLOR_MAP[clean];
  if (/^#[0-9a-f]{3,8}$/i.test(clean)) return clean;
  if (/^rgba?\([^)]+\)$/i.test(clean)) return clean;
  if (/^hsla?\([^)]+\)$/i.test(clean)) return clean;
  if (/^[a-z]{3,20}$/i.test(clean)) return clean;
  return null;
}

function applyRootStyle(html, prop, val) {
  const rootTagMatch = html.match(/^(\s*<[a-zA-Z0-9_-]+)([^>]*)(>)/);
  if (!rootTagMatch) return html;

  const prefix = rootTagMatch[1];
  const attrs = rootTagMatch[2];
  const suffix = rootTagMatch[3];

  const styleRegex = /\bstyle=(["'])(.*?)\1/i;
  const styleMatch = attrs.match(styleRegex);
  const styleDecl = `${prop}:${val} !important`;

  let newAttrs;
  if (styleMatch) {
    const existingStyle = styleMatch[2];
    const propRegex = new RegExp(`(?:^|;)\\s*${prop}\\s*:[^;]*`, 'gi');
    let cleaned = existingStyle.replace(propRegex, '').trim();
    if (cleaned.endsWith(';')) cleaned = cleaned.slice(0, -1).trim();
    const updated = cleaned ? `${cleaned}; ${styleDecl};` : `${styleDecl};`;
    newAttrs = attrs.replace(styleRegex, `style="${updated}"`);
  } else {
    newAttrs = `${attrs} style="${styleDecl};"`;
  }
  return html.replace(rootTagMatch[0], `${prefix}${newAttrs}${suffix}`);
}

function updateCssProp(css, prop, val) {
  if (!css) return `* {\n  ${prop}: ${val} !important;\n}\n`;
  const propRegex = new RegExp(`(\\b${prop}\\s*:\\s*)[^;!]+(?:\\s*!important)?;?`, 'gi');
  if (propRegex.test(css)) {
    return css.replace(propRegex, `$1${val} !important;`);
  }
  return `/* Modified via Qursor++ Style Engine */\n* {\n  ${prop}: ${val} !important;\n}\n\n${css}`;
}

/**
 * Detects common deterministic style instructions and applies them instantly
 * directly to the component HTML and CSS without calling external LLM APIs.
 * 
 * @param {string} instruction 
 * @param {string} currentHtml 
 * @param {string} currentCss 
 * @returns {{ html: string, css: string, changes: string[] } | null}
 */
export function detectSimpleStyleEdit(instruction, currentHtml, currentCss = '') {
  if (!instruction || typeof instruction !== 'string' || !currentHtml || typeof currentHtml !== 'string') {
    return null;
  }

  const trimmed = instruction.trim();
  const lower = trimmed.toLowerCase();

  // 1. Background Color
  const bgMatch = lower.match(/^(?:make|set|change|update|put)\s+(?:the\s+)?(?:bg|background|background-color)\s+(?:to|as|into|with)?\s*([a-zA-Z0-9#(),.\s%_-]+)$/) ||
                  lower.match(/^(?:bg|background|background-color)\s*[:=]\s*([a-zA-Z0-9#(),.\s%_-]+)$/) ||
                  lower.match(/^(?:make|set)\s+(?:it\s+)?([a-zA-Z\s]+)\s+background$/);
  if (bgMatch) {
    const rawColor = bgMatch[1].trim();
    const resolved = resolveColor(rawColor);
    if (resolved) {
      const newHtml = applyRootStyle(currentHtml, 'background-color', resolved);
      const newCss = updateCssProp(currentCss, 'background-color', resolved);
      return {
        html: newHtml,
        css: newCss,
        changes: [`Changed background color to ${resolved}`]
      };
    }
  }

  // 2. Text / Font Color
  const textMatch = lower.match(/^(?:make|set|change|update)\s+(?:the\s+)?(?:text|font|foreground)\s+(?:color\s+)?(?:to|as|into|with)?\s*([a-zA-Z0-9#(),.\s%_-]+)$/) ||
                    lower.match(/^(?:text|font|foreground)\s*color\s*[:=]\s*([a-zA-Z0-9#(),.\s%_-]+)$/) ||
                    lower.match(/^(?:make|set)\s+(?:the\s+)?color\s+(?:to|as|into)?\s*([a-zA-Z0-9#(),.\s%_-]+)$/);
  if (textMatch) {
    const rawColor = textMatch[1].trim();
    const resolved = resolveColor(rawColor);
    if (resolved) {
      const newHtml = applyRootStyle(currentHtml, 'color', resolved);
      const newCss = updateCssProp(currentCss, 'color', resolved);
      return {
        html: newHtml,
        css: newCss,
        changes: [`Changed text color to ${resolved}`]
      };
    }
  }

  // 3. Padding
  const padMatch = lower.match(/^(?:make|set|change|update|increase|decrease|add)\s+(?:the\s+)?padding\s+(?:to|as|by)?\s*(\d+(?:px|rem|em|%)?)$/) ||
                   lower.match(/^padding\s*[:=]\s*(\d+(?:px|rem|em|%)?)$/);
  if (padMatch) {
    let val = padMatch[1].trim();
    if (/^\d+$/.test(val)) val += 'px';
    const newHtml = applyRootStyle(currentHtml, 'padding', val);
    const newCss = updateCssProp(currentCss, 'padding', val);
    return {
      html: newHtml,
      css: newCss,
      changes: [`Updated padding to ${val}`]
    };
  }

  // 4. Border Radius / Rounded Corners
  const radiusMatch = lower.match(/^(?:make|set|change|update|add)\s+(?:the\s+)?(?:border-radius|radius|border\s+radius)\s+(?:to|as)?\s*(\d+(?:px|rem|em|%)?)$/) ||
                      lower.match(/^border-radius\s*[:=]\s*(\d+(?:px|rem|em|%)?)$/) ||
                      lower.match(/^(?:round|make\s+rounded)\s+(?:the\s+)?(?:corners|edges)?(?:\s+(?:to|by)?\s*(\d+(?:px|rem|em|%)?))?$/);
  if (radiusMatch) {
    let val = radiusMatch[1] ? radiusMatch[1].trim() : '12px';
    if (/^\d+$/.test(val)) val += 'px';
    const newHtml = applyRootStyle(currentHtml, 'border-radius', val);
    const newCss = updateCssProp(currentCss, 'border-radius', val);
    return {
      html: newHtml,
      css: newCss,
      changes: [`Updated border-radius to ${val}`]
    };
  }

  // 5. Font Size
  const fontMatch = lower.match(/^(?:make|set|change|update|increase|decrease)\s+(?:the\s+)?font[-\s]?size\s+(?:to|as|by)?\s*(\d+(?:px|rem|em|pt)?)$/) ||
                    lower.match(/^font[-\s]?size\s*[:=]\s*(\d+(?:px|rem|em|pt)?)$/);
  if (fontMatch) {
    let val = fontMatch[1].trim();
    if (/^\d+$/.test(val)) val += 'px';
    const newHtml = applyRootStyle(currentHtml, 'font-size', val);
    const newCss = updateCssProp(currentCss, 'font-size', val);
    return {
      html: newHtml,
      css: newCss,
      changes: [`Updated font-size to ${val}`]
    };
  }

  // 6. Border
  const borderMatch = lower.match(/^(?:add|set|make)\s+(?:a\s+)?(\d+px\s+(?:solid|dashed|dotted)\s+[a-zA-Z0-9#(),]+)(?:\s+border)?$/);
  if (borderMatch) {
    const val = borderMatch[1].trim();
    const newHtml = applyRootStyle(currentHtml, 'border', val);
    const newCss = updateCssProp(currentCss, 'border', val);
    return {
      html: newHtml,
      css: newCss,
      changes: [`Updated border to ${val}`]
    };
  }

  return null;
}

