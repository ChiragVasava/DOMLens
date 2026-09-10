/**
 * Qursor++ - Interactive Style Editor & Instruction Parser
 * 
 * Parses text instructions (e.g., "make background blue", "change font size to 24px", "set padding 16px")
 * and handles style mutations for live preview re-rendering and code generation export.
 */

export class StyleEditor {
  constructor() {
    this.customStyles = {};
  }

  /**
   * Resets custom edits
   */
  reset() {
    this.customStyles = {};
  }

  /**
   * Applies a key-value style modification directly
   * @param {string} property CSS property name (e.g. 'backgroundColor', 'color', 'fontSize')
   * @param {string} value CSS property value
   */
  setStyle(property, value) {
    if (!property || !value) return;
    this.customStyles[property] = value;
  }

  /**
   * Parses natural language instruction string and applies CSS modifications
   * @param {string} instruction Text input e.g. "make background blue"
   * @returns {Object} Updated styles map
   */
  parseAndApplyInstruction(instruction) {
    if (!instruction || typeof instruction !== 'string') return this.customStyles;

    const text = instruction.toLowerCase().trim();

    // Background Color
    if (text.includes('background')) {
      const color = extractColorName(text);
      if (color) this.setStyle('backgroundColor', color);
    }

    // Text Color
    if (text.includes('text color') || text.includes('color') || text.includes('font color')) {
      const color = extractColorName(text);
      if (color) this.setStyle('color', color);
    }

    // Font Size
    if (text.includes('font size') || text.includes('size')) {
      const match = text.match(/\d+(px|em|rem|%)/) || text.match(/\b\d+\b/);
      if (match) {
        const val = match[0].includes('px') ? match[0] : `${match[0]}px`;
        this.setStyle('fontSize', val);
      }
    }

    // Font Weight / Bold
    if (text.includes('bold') || text.includes('weight')) {
      if (text.includes('bold')) this.setStyle('fontWeight', '700');
      else if (text.includes('normal')) this.setStyle('fontWeight', '400');
      else if (text.includes('light')) this.setStyle('fontWeight', '300');
    }

    // Width
    if (text.includes('width')) {
      const match = text.match(/\d+(px|%|vw)/) || text.match(/\b\d+\b/);
      if (match) {
        const val = match[0].includes('px') || match[0].includes('%') ? match[0] : `${match[0]}px`;
        this.setStyle('width', val);
      }
    }

    // Height
    if (text.includes('height')) {
      const match = text.match(/\d+(px|%|vh)/) || text.match(/\b\d+\b/);
      if (match) {
        const val = match[0].includes('px') || match[0].includes('%') ? match[0] : `${match[0]}px`;
        this.setStyle('height', val);
      }
    }

    // Padding
    if (text.includes('padding')) {
      const match = text.match(/\d+(px|em)/) || text.match(/\b\d+\b/);
      if (match) {
        const val = match[0].includes('px') ? match[0] : `${match[0]}px`;
        this.setStyle('padding', val);
      }
    }

    // Margin
    if (text.includes('margin')) {
      const match = text.match(/\d+(px|em)/) || text.match(/\b\d+\b/);
      if (match) {
        const val = match[0].includes('px') ? match[0] : `${match[0]}px`;
        this.setStyle('margin', val);
      }
    }

    // Border Radius
    if (text.includes('border radius') || text.includes('radius') || text.includes('rounded')) {
      const match = text.match(/\d+(px|%)/) || text.match(/\b\d+\b/);
      if (match) {
        const val = match[0].includes('px') || match[0].includes('%') ? match[0] : `${match[0]}px`;
        this.setStyle('borderRadius', val);
      }
    }

    return this.customStyles;
  }

  /**
   * Applies accumulated style mutations to raw CSS output block
   * @param {string} rawCss Original raw CSS string
   * @returns {string} Mutated raw CSS string
   */
  applyToRawCss(rawCss) {
    if (!rawCss) rawCss = '';
    let updatedCss = rawCss;

    Object.entries(this.customStyles).forEach(([prop, val]) => {
      const cssProp = kebabCase(prop);
      const regex = new RegExp(`${cssProp}:[^;]+;`, 'gi');
      if (regex.test(updatedCss)) {
        updatedCss = updatedCss.replace(regex, `${cssProp}: ${val} !important;`);
      } else {
        updatedCss += `\n  ${cssProp}: ${val} !important;`;
      }
    });

    return updatedCss;
  }
}

function extractColorName(text) {
  const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'orange', 'pink', 'gray', 'grey', 'cyan', 'transparent'];
  for (const c of colors) {
    if (text.includes(c)) return c;
  }
  const hexMatch = text.match(/#[0-9a-f]{3,6}/i);
  if (hexMatch) return hexMatch[0];
  const rgbMatch = text.match(/rgba?\([^)]+\)/i);
  if (rgbMatch) return rgbMatch[0];
  return null;
}

function kebabCase(str) {
  return str.replace(/([a-z0-9]|(?<=([a-z0-9])))([A-Z])/g, '$1-$2').toLowerCase();
}
