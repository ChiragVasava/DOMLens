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
  const textSnippet = general.textContent ? `"${general.textContent.substring(0, 120)}"` : 'None';
  const widthPx = data.widthPx || 0;
  const heightPx = data.heightPx || 0;

  // Colors in Hex
  const hexColor = colors.hexColor || (colors.color ? colors.color : 'Inherit');
  const hexBg = colors.hexBgColor || (colors.backgroundColor ? colors.backgroundColor : 'Transparent');

  // Asset Detection (SVG / Image)
  let assetInfo = 'No external media assets';
  if (specialDetails.type === 'IMAGE') {
    assetInfo = `Image element detected (URL: ${specialDetails.imageUrl}, Displayed: ${widthPx}x${heightPx}px)`;
  } else if (tag === 'SVG' || (general.fullOuterHTML && general.fullOuterHTML.includes('<svg'))) {
    assetInfo = `Inline SVG graphic detected. Include vector icon/graphic in implementation.`;
  }

  // Interactive States
  let stateInfo = [];
  if (general.disabled) stateInfo.push('Disabled State');
  if (general.required) stateInfo.push('Required Input');
  if (specialDetails.type === 'LINK') stateInfo.push(`Hyperlink (destination: ${specialDetails.href})`);
  if (specialDetails.type === 'BUTTON') stateInfo.push(`Interactive Button (type: ${specialDetails.buttonType})`);
  const stateSummary = stateInfo.length > 0 ? stateInfo.join(', ') : 'Standard Static Element';

  // Concise Structural Skeleton (avoiding huge raw HTML code dumps)
  let structuralSkeleton = `<${tag.toLowerCase()}`;
  if (general.id && general.id !== 'N/A') structuralSkeleton += ` id="${general.id}"`;
  if (data.classes && data.classes.length) structuralSkeleton += ` class="${data.classes.join(' ')}"`;
  structuralSkeleton += `>... [${dom.childrenCount || 0} child elements, ${dom.childTags ? dom.childTags.join(', ') : 'text'}] </${tag.toLowerCase()}>`;

  return `Task: Build a modern, pixel-perfect, accessible ${targetFramework} component based on the following inspected web element instructions.

--- HUMAN-READABLE COMPONENT INSTRUCTIONS ---

1. COMPONENT PURPOSE & TARGET:
   - Primary Element Tag: <${tag}> (Semantic Role: ${role})
   - Dimensions: ${widthPx}px width × ${heightPx}px height
   - CSS Selector Target: \`${selector}\`
   - Primary Text / Label Content: ${textSnippet}

2. VISUAL DESIGN & COLOR PALETTE:
   - Text Color: ${hexColor} (${colors.color || 'default'})
   - Background Color: ${hexBg} (${colors.backgroundColor || 'transparent'})
   - Border Radius: ${border.borderRadius || '0px'} (Width: ${border.borderWidth || '0px'}, Style: ${border.borderStyle || 'none'})
   - Box Shadow: ${colors.boxShadow || 'none'}
   - Opacity: ${colors.opacity || '1.0'}

3. TYPOGRAPHY SPECIFICATIONS:
   - Font Family: ${typography.fontFamily || 'system-ui, sans-serif'}
   - Font Size: ${typography.fontSize || '16px'}
   - Font Weight: ${typography.fontWeight || '400'}
   - Line Height: ${typography.lineHeight || 'normal'}
   - Letter Spacing: ${typography.letterSpacing || 'normal'}
   - Alignment: ${typography.textAlign || 'left'}

4. LAYOUT, FLEXBOX & BOX MODEL SPACING:
   - Display Mode: ${layout.display || 'block'}
   - Position Mode: ${layout.position || 'static'} (Z-Index: ${layout.zIndex || 'auto'})
   - Padding (Top Right Bottom Left): ${spacing.padding || '0px'}
   - Margin (Top Right Bottom Left): ${spacing.margin || '0px'}
   - Alignment Architecture: Direction=${flexGrid.flexDirection || 'row'}, Justification=${flexGrid.justifyContent || 'flex-start'}, Items Alignment=${flexGrid.alignItems || 'stretch'}, Gap=${flexGrid.gap || '0px'}

5. DOM HIERARCHY & STRUCTURE:
   - Structural Skeleton: \`${structuralSkeleton}\`
   - Parent Container: <${dom.parentTag || 'body'}>
   - Nesting Depth: Level ${dom.depth || 1}
   - Child Count: ${dom.childrenCount || 0} child nodes

6. MEDIA & BEHAVIORAL STATES:
   - Asset Info: ${assetInfo}
   - Interactivity & States: ${stateSummary}
   - Accessibility Label: ${general.accessibleName || 'N/A'}

--- AI CODE GENERATION REQUIREMENTS ---
- Implement a complete, production-ready ${targetFramework} component adhering to the design specifications above.
- Ensure exact visual styling, typography, colors, and responsive layout alignment.
- Write clean, maintainable, self-contained component code with zero broken dependencies.`;
}

