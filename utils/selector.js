/**
 * Website Inspector AI - Selector Utility
 * 
 * Provides robust algorithm for generating precise CSS selectors
 * for target DOM elements.
 */

/**
 * Escapes special CSS characters in class names or IDs
 * @param {string} str 
 * @returns {string}
 */
function escapeCssIdentifier(str) {
  if (!str) return '';
  // Use CSS.escape if available in environment
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(str);
  }
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Generates a unique CSS Selector path for a target element
 * @param {Element} element 
 * @returns {string}
 */
export function getCssSelector(element) {
  if (!(element instanceof Element)) return '';

  // 1. Direct ID match if unique in document
  if (element.id) {
    const escapedId = escapeCssIdentifier(element.id);
    const selector = `#${escapedId}`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  const path = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();

    // Check if element has unique ID
    if (current.id) {
      const escapedId = escapeCssIdentifier(current.id);
      selector += `#${escapedId}`;
      path.unshift(selector);
      break; // Unique anchor found
    } else {
      // Add classes if available
      const classes = Array.from(current.classList)
        .filter(c => c && !c.startsWith('website-inspector')) // exclude Inspector's internal classes
        .map(c => escapeCssIdentifier(c));

      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }

      // Check if current selector is unique among siblings
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const matches = siblings.filter(child => {
          if (child.nodeName !== current.nodeName) return false;
          if (classes.length > 0) {
            return classes.every(c => child.classList.contains(c));
          }
          return true;
        });

        if (matches.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }
    }

    path.unshift(selector);

    // Stop at body tag to keep selector readable
    if (current.nodeName.toLowerCase() === 'body' || current.nodeName.toLowerCase() === 'html') {
      break;
    }

    current = current.parentElement;
  }

  return path.join(' > ');
}

