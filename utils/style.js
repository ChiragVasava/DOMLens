/**
 * Website Inspector AI - Computed Style Utility
 * 
 * Extracts and formats computed styles for layout, typography, colors, flexbox, and grid.
 */

/**
 * Converts rgb/rgba string to hex string
 * @param {string} rgbStr 
 * @returns {string}
 */
export function rgbToHex(rgbStr) {
  if (!rgbStr || rgbStr === 'transparent') return 'transparent';
  const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) return rgbStr;

  const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
  
  if (match[4] !== undefined && parseFloat(match[4]) < 1) {
    const a = Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }
  return `#${r}${g}${b}`;
}

/**
 * Reads all specified computed styles from an element
 * @param {Element} element 
 * @returns {Object} Grouped style dictionary
 */
export function extractComputedStyles(element) {
  if (!(element instanceof Element)) return {};

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return {
    layout: {
      width: `${Math.round(rect.width * 100) / 100}px`,
      height: `${Math.round(rect.height * 100) / 100}px`,
      top: `${Math.round(rect.top * 100) / 100}px`,
      left: `${Math.round(rect.left * 100) / 100}px`,
      bottom: `${Math.round(rect.bottom * 100) / 100}px`,
      right: `${Math.round(rect.right * 100) / 100}px`,
      display: style.display,
      position: style.position,
      overflow: style.overflow,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex === 'auto' ? 'auto' : style.zIndex,
      boxSizing: style.boxSizing
    },
    spacing: {
      margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
      padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
      gap: style.gap !== 'normal' ? style.gap : style.rowGap ? `${style.rowGap} ${style.columnGap}` : 'normal',
      marginTop: style.marginTop,
      marginRight: style.marginRight,
      marginBottom: style.marginBottom,
      marginLeft: style.marginLeft,
      paddingTop: style.paddingTop,
      paddingRight: style.paddingRight,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft
    },
    typography: {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      wordSpacing: style.wordSpacing,
      textAlign: style.textAlign,
      textTransform: style.textTransform,
      textDecoration: style.textDecorationLine || style.textDecoration
    },
    colors: {
      textColor: `${style.color} (${rgbToHex(style.color)})`,
      backgroundColor: `${style.backgroundColor} (${rgbToHex(style.backgroundColor)})`,
      borderColor: style.borderColor ? `${style.borderColor} (${rgbToHex(style.borderColor)})` : 'none',
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow !== 'none' ? style.boxShadow : 'none',
      opacity: style.opacity
    },
    border: {
      borderWidth: `${style.borderTopWidth} ${style.borderRightWidth} ${style.borderBottomWidth} ${style.borderLeftWidth}`,
      borderRadius: style.borderRadius,
      borderStyle: style.borderTopStyle,
      borderColor: style.borderColor
    },
    flexGrid: {
      display: style.display,
      flexDirection: style.flexDirection,
      justifyContent: style.justifyContent,
      alignItems: style.alignItems,
      alignContent: style.alignContent,
      flexWrap: style.flexWrap,
      gridTemplateColumns: style.gridTemplateColumns !== 'none' ? style.gridTemplateColumns : 'N/A',
      gridTemplateRows: style.gridTemplateRows !== 'none' ? style.gridTemplateRows : 'N/A',
      gap: style.gap
    }
  };
}

/**
 * Returns raw key-value map of all meaningful computed styles for CSS tab view
 * @param {Element} element 
 * @returns {Record<string, string>}
 */
export function getRawCssString(element) {
  if (!(element instanceof Element)) return '';
  const style = window.getComputedStyle(element);
  const importantProps = [
    'display', 'position', 'width', 'height', 'min-width', 'min-height',
    'margin', 'padding', 'box-sizing',
    'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration',
    'color', 'background-color', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'box-shadow', 'outline', 'opacity', 'cursor',
    'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'gap',
    'grid-template-columns', 'grid-template-rows', 'z-index'
  ];

  return importantProps
    .map(prop => {
      const val = style.getPropertyValue(prop);
      return val && val !== 'initial' && val !== 'normal' && val !== 'none' && val !== 'auto' && val !== '0px none rgb(248, 250, 252)'
        ? `  ${prop}: ${val};`
        : null;
    })
    .filter(Boolean)
    .join('\n');
}
