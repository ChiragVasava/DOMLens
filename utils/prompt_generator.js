/**
 * Qursor++ - Structured AI Prompt Synthesizer
 * 
 * Aggregates complete extracted element telemetry (structure, computed CSS, layout, 
 * typography, color palette, assets, accessibility, interaction states) and formats a 
 * production-ready prompt optimized for AI coding agents (Cursor, Claude, Antigravity, ChatGPT).
 */

export function generateStructuredAiPrompt(data, targetFramework = 'React') {
  if (!data) return '/* Select an element on the webpage to generate an AI prompt */';

  const general = data.general || {};
  const dom = data.dom || {};
  const layout = data.layout || {};
  const typography = data.typography || {};
  const colors = data.colors || {};
  const spacing = data.spacing || {};
  const border = data.border || {};
  const flexGrid = data.flexGrid || {};
  const specialDetails = data.specialDetails || {};

  const tag = general.tagName || 'DIV';
  const role = general.role !== 'N/A' ? general.role : tag.toLowerCase();
  const selector = data.selector || 'N/A';
  const xpath = data.xpath || 'N/A';
  const textSnippet = general.textContent ? `"${general.textContent.substring(0, 150)}..."` : 'None';
  const widthPx = data.widthPx || 0;
  const heightPx = data.heightPx || 0;

  // Asset Detection (SVG / Image)
  let assetInfo = 'None';
  if (specialDetails.type === 'IMAGE') {
    assetInfo = `Image Source: ${specialDetails.imageUrl} (Natural size: ${specialDetails.naturalWidth} x ${specialDetails.naturalHeight})`;
  } else if (tag === 'SVG' || (general.fullOuterHTML && general.fullOuterHTML.includes('<svg'))) {
    assetInfo = `Inline SVG graphic detected. Include exact SVG markup in component implementation.`;
  }

  // Interactive States
  let stateInfo = [];
  if (general.disabled) stateInfo.push('Disabled');
  if (general.required) stateInfo.push('Required');
  if (specialDetails.type === 'LINK') stateInfo.push(`Hyperlink (href: ${specialDetails.href})`);
  if (specialDetails.type === 'BUTTON') stateInfo.push(`Button Trigger (type: ${specialDetails.buttonType})`);
  const stateSummary = stateInfo.length > 0 ? stateInfo.join(', ') : 'Standard Static Element';

  return `Recreate the following web UI component as a clean, production-ready ${targetFramework} component.

=== TARGET SPECIFICATION ===
- Element Tag: <${tag}>
- ARIA Role / Semantic Type: ${role}
- CSS Selector: ${selector}
- XPath: ${xpath}
- Dimensions: ${widthPx}px width × ${heightPx}px height
- Text Content: ${textSnippet}

=== DOM HIERARCHY & STRUCTURE ===
- Parent Element: ${dom.parentTag ? `<${dom.parentTag}>` : 'Unknown'}
- DOM Tree Depth Level: ${dom.depth || 1}
- Child Element Count: ${dom.childCount || 0}
- Clean Outer HTML:
\`\`\`html
${general.fullOuterHTML || 'N/A'}
\`\`\`

=== VISUAL APPEARANCE & STYLING ===
- Text Color: ${colors.color || 'N/A'}
- Background Color: ${colors.backgroundColor || 'N/A'}
- Border Color: ${border.borderColor || 'N/A'}
- Box Shadow: ${colors.boxShadow || 'none'}
- Opacity: ${colors.opacity || '1'}

=== TYPOGRAPHY ===
- Font Family: ${typography.fontFamily || 'Inherit'}
- Font Size: ${typography.fontSize || 'N/A'}
- Font Weight: ${typography.fontWeight || 'Normal'}
- Line Height: ${typography.lineHeight || 'Normal'}
- Letter Spacing: ${typography.letterSpacing || 'Normal'}
- Text Alignment: ${typography.textAlign || 'Left'}

=== LAYOUT & BOX MODEL SPACING ===
- Display Type: ${layout.display || 'block'}
- Position Type: ${layout.position || 'static'} (Z-Index: ${layout.zIndex || 'auto'})
- Margin (Top Right Bottom Left): ${spacing.margin || '0px'}
- Padding (Top Right Bottom Left): ${spacing.padding || '0px'}
- Flexbox / Grid Config: Flex Direction=${flexGrid.flexDirection || 'row'}, Justify=${flexGrid.justifyContent || 'flex-start'}, Align=${flexGrid.alignItems || 'stretch'}, Gap=${flexGrid.gap || '0px'}

=== BORDERS & RADIUS ===
- Border Width: ${border.borderWidth || '0px'}
- Border Style: ${border.borderStyle || 'none'}
- Border Radius: ${border.borderRadius || '0px'}

=== ASSETS & MEDIA ===
- ${assetInfo}

=== INTERACTION & BEHAVIORAL STATES ===
- Interactive States: ${stateSummary}
- Accessible Name / ARIA Label: ${general.ariaAttributes ? JSON.stringify(general.ariaAttributes) : 'N/A'}

=== IMPLEMENTATION REQUIREMENTS FOR AI CODING AGENT ===
1. Recreate the component cleanly using idiomatic ${targetFramework} patterns.
2. Preserve exact visual appearance, dimensions, typography, colors, and layout spacing.
3. Use semantic HTML elements and accessible ARIA attributes where appropriate.
4. Maintain responsive bounds and visual hierarchy.
5. Avoid unnecessary external dependencies or fake placeholder logic.
6. Provide clean, maintainable, modular code.`;
}
