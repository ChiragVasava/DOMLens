/**
 * Qursor++ - Computed CSS to Tailwind Utility Class Mapper
 * 
 * Analyzes computed style objects and converts visual declarations into clean Tailwind CSS classes.
 */

export function mapStylesToTailwind(styles, tag = '') {
  const classes = [];

  if (!styles) return '';

  const layout = styles.layout || {};
  const spacing = styles.spacing || {};
  const typography = styles.typography || {};
  const colors = styles.colors || {};
  const border = styles.border || {};
  const flexGrid = styles.flexGrid || {};

  // Display
  const displayMap = {
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'block': 'block',
    'inline-block': 'inline-block',
    'inline': 'inline',
    'none': 'hidden'
  };
  if (layout.display && displayMap[layout.display]) {
    classes.push(displayMap[layout.display]);
  }

  // Position
  const posMap = {
    'relative': 'relative',
    'absolute': 'absolute',
    'fixed': 'fixed',
    'sticky': 'sticky'
  };
  if (layout.position && posMap[layout.position]) {
    classes.push(posMap[layout.position]);
  }

  // Flexbox
  if (layout.display === 'flex' || layout.display === 'inline-flex') {
    if (flexGrid.flexDirection === 'column') classes.push('flex-col');
    if (flexGrid.flexDirection === 'row') classes.push('flex-row');

    if (flexGrid.flexWrap === 'wrap') classes.push('flex-wrap');

    const justifyMap = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'center': 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly'
    };
    if (flexGrid.justifyContent && justifyMap[flexGrid.justifyContent]) {
      classes.push(justifyMap[flexGrid.justifyContent]);
    }

    const itemsMap = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      'center': 'items-center',
      'baseline': 'items-baseline',
      'stretch': 'items-stretch'
    };
    if (flexGrid.alignItems && itemsMap[flexGrid.alignItems]) {
      classes.push(itemsMap[flexGrid.alignItems]);
    }
  }

  // Gap
  if (flexGrid.gap && flexGrid.gap !== 'normal' && flexGrid.gap !== '0px') {
    const gapPx = parseFloat(flexGrid.gap);
    if (!isNaN(gapPx) && gapPx > 0) {
      classes.push(pxToTailwindUnit('gap', gapPx));
    }
  }

  // Spacing (Padding & Margin)
  if (spacing.padding) {
    const p = parseBoxSpacing(spacing.padding);
    if (p.top === p.bottom && p.left === p.right && p.top === p.left) {
      if (p.top > 0) classes.push(pxToTailwindUnit('p', p.top));
    } else {
      if (p.top === p.bottom && p.top > 0) classes.push(pxToTailwindUnit('py', p.top));
      else {
        if (p.top > 0) classes.push(pxToTailwindUnit('pt', p.top));
        if (p.bottom > 0) classes.push(pxToTailwindUnit('pb', p.bottom));
      }
      if (p.left === p.right && p.left > 0) classes.push(pxToTailwindUnit('px', p.left));
      else {
        if (p.left > 0) classes.push(pxToTailwindUnit('pl', p.left));
        if (p.right > 0) classes.push(pxToTailwindUnit('pr', p.right));
      }
    }
  }

  // Typography
  if (typography.fontSize) {
    const sizePx = parseFloat(typography.fontSize);
    if (sizePx <= 12) classes.push('text-xs');
    else if (sizePx <= 14) classes.push('text-sm');
    else if (sizePx <= 16) classes.push('text-base');
    else if (sizePx <= 18) classes.push('text-lg');
    else if (sizePx <= 20) classes.push('text-xl');
    else if (sizePx <= 24) classes.push('text-2xl');
    else if (sizePx <= 30) classes.push('text-3xl');
    else classes.push(`text-[${typography.fontSize}]`);
  }

  if (typography.fontWeight) {
    const weight = parseInt(typography.fontWeight, 10);
    if (weight >= 700) classes.push('font-bold');
    else if (weight >= 600) classes.push('font-semibold');
    else if (weight >= 500) classes.push('font-medium');
    else if (weight <= 300) classes.push('font-light');
  }

  if (typography.textAlign && typography.textAlign !== 'start') {
    classes.push(`text-${typography.textAlign}`);
  }

  // Border Radius
  if (border.borderRadius && border.borderRadius !== '0px') {
    const radiusPx = parseFloat(border.borderRadius);
    if (radiusPx >= 999) classes.push('rounded-full');
    else if (radiusPx >= 16) classes.push('rounded-2xl');
    else if (radiusPx >= 12) classes.push('rounded-xl');
    else if (radiusPx >= 8) classes.push('rounded-lg');
    else if (radiusPx >= 4) classes.push('rounded');
    else if (radiusPx >= 2) classes.push('rounded-sm');
    else classes.push(`rounded-[${border.borderRadius}]`);
  }

  // Colors (Background & Text)
  if (colors.backgroundColor && colors.backgroundColor !== 'rgba(0, 0, 0, 0)' && colors.backgroundColor !== 'transparent') {
    const hex = rgbToHex(colors.backgroundColor);
    if (hex) classes.push(`bg-[${hex}]`);
  }

  if (colors.color && colors.color !== 'rgba(0, 0, 0, 0)') {
    const hex = rgbToHex(colors.color);
    if (hex) classes.push(`text-[${hex}]`);
  }

  // Border Width & Color
  if (border.borderWidth && border.borderWidth !== '0px') {
    const bPx = parseFloat(border.borderWidth);
    if (bPx === 1) classes.push('border');
    else if (bPx > 1) classes.push(`border-[${border.borderWidth}]`);
    
    if (border.borderColor && border.borderColor !== 'transparent') {
      const hex = rgbToHex(border.borderColor);
      if (hex) classes.push(`border-[${hex}]`);
    }
  }

  return classes.filter(Boolean).join(' ');
}

function pxToTailwindUnit(prefix, px) {
  const rem = px / 16;
  const unit = rem * 4;
  if (Number.isInteger(unit)) return `${prefix}-${unit}`;
  return `${prefix}-[${px}px]`;
}

function parseBoxSpacing(spacingStr) {
  if (!spacingStr) return { top: 0, right: 0, bottom: 0, left: 0 };
  const parts = spacingStr.split(' ').map(p => parseFloat(p) || 0);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  if (parts.length === 4) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

function rgbToHex(colorStr) {
  if (!colorStr) return '';
  if (colorStr.startsWith('#')) return colorStr;
  const match = colorStr.match(/\d+/g);
  if (match && match.length >= 3) {
    const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '';
}
