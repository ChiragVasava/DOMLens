/**
 * Website Inspector AI - DOM Utility
 * 
 * Provides DOM hierarchy analysis, element depth calculation, sibling traversal,
 * and element categorization helpers.
 */

/**
 * Calculates element depth in the DOM tree relative to Document root
 * @param {Element} element 
 * @returns {number}
 */
export function getElementDepth(element) {
  let depth = 0;
  let current = element;
  while (current && current.parentElement) {
    depth++;
    current = current.parentElement;
  }
  return depth;
}

/**
 * Extracts info about parent, siblings, and children of an element
 * @param {Element} element 
 * @returns {Object}
 */
export function getDomHierarchy(element) {
  if (!(element instanceof Element)) {
    return {
      parentTag: 'N/A',
      childrenCount: 0,
      childTags: [],
      previousSiblingTag: 'None',
      nextSiblingTag: 'None',
      depth: 0
    };
  }

  const parent = element.parentElement;
  const prev = element.previousElementSibling;
  const next = element.nextElementSibling;
  const children = Array.from(element.children);

  // Extract unique child tags (limit to first 10 for performance)
  const childTagNames = Array.from(new Set(children.map(c => c.tagName.toLowerCase()))).slice(0, 10);

  return {
    parentTag: parent ? parent.tagName.toLowerCase() : 'N/A',
    parentId: parent && parent.id ? parent.id : '',
    parentClasses: parent ? Array.from(parent.classList) : [],
    childrenCount: element.childElementCount,
    childTags: childTagNames,
    previousSiblingTag: prev ? prev.tagName.toLowerCase() : 'None',
    nextSiblingTag: next ? next.tagName.toLowerCase() : 'None',
    depth: getElementDepth(element)
  };
}

/**
 * Gets all non-empty attribute key-value pairs of an element
 * @param {Element} element 
 * @returns {Record<string, string>}
 */
export function getElementAttributes(element) {
  if (!(element instanceof Element)) return {};
  const attrs = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * Safe text content summarizer (truncates long text)
 * @param {Element} element 
 * @param {number} maxLength 
 * @returns {string}
 */
export function getCleanTextContent(element, maxLength = 300) {
  if (!element) return '';
  const text = (element.textContent || '').trim().replace(/\s+/g, ' ');
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}
