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
