# 04 - Feature Catalog

## Feature Status Summary

```text
Completed Features (Phase 1 & Phase 2): 11
In Development Features: 0
Planned Features (Phase 3 & Future): 5
```

---

## Implemented Features (`Completed`)

### Phase 1 Features
1. **Interactive Hover Inspector**: Real-time blue overlay box tracking element cursor movement.
2. **Sub-pixel Bounding Box & Dimension Tooltip**: Displays tag name, ID, class names, and rendered width × height in sub-pixel floating pill.
3. **Capture-Phase Click Interceptor**: Intercepts element clicks (`e.preventDefault()`, `e.stopPropagation()`) so links/buttons do not execute native page actions while inspecting.
4. **Popup Controller UI**: Dark mode popup with real-time status pill, toggle switch, and shortcut cheat-sheet.
5. **Keyboard Command Listener**: Instant toggle via global shortcut `Ctrl+Shift+I` / `Cmd+Shift+I`.
6. **Escape Key Abort Handler**: Instantly exit inspect mode using `ESC`.

### Phase 2 Features
7. **Shadow DOM Isolated Panel**: Movable, resizable, collapsible dark glassmorphism inspector panel rendered inside Shadow DOM (`<website-inspector-root>`).
8. **11 Detailed Inspector Tabs**:
   - `General`: Tag name, ID, class list, text content, input value, ARIA role, form state.
   - `Layout`: Rendered bounding width/height, positioning (`top`, `left`, `bottom`, `right`), display mode, z-index, visibility, box-sizing.
   - `Typography`: Font family, font size, font weight, line height, letter spacing, text alignment, text transform, text decoration.
   - `Colors`: Computed text color, background color, border color, outline color, box shadow (includes automatic RGB-to-Hex conversions).
   - `Spacing`: Box model margins, paddings, layout gap values.
   - `Border`: Border width, border radius, border style, border color.
   - `Flex & Grid`: Flex direction, justify-content, align-items, flex wrap, grid template columns, grid template rows, gap.
   - `DOM`: Parent tag/ID, child element count, child tag list, previous/next sibling tags, DOM depth tree level, CSS selector, XPath.
   - `Attributes`: Comprehensive key-value list of all HTML attributes present on the node.
   - `HTML`: Formatted outer HTML code block.
   - `CSS`: Clean, formatted CSS rule block of key computed style properties.
9. **1-Click DevTools Clipboard Copy**: Quick-action buttons to copy JSON payload, HTML, OuterHTML, Selector, XPath, or raw CSS rules directly to clipboard.
10. **Specialized Tag Data Extraction**: Extracts natural dimensions for `<img>`, target/rel for `<a>`, type/form ID for `<button>`, and placeholder/validation state for `<input>`.
11. **DOM Tree Depth Analysis**: Recursively calculates node depth relative to `document.body`.

---

## Planned Features (`Planned` - Phase 3 & Beyond)

1. **Live Style Preview & Editing** (`Phase 3`): Inline property editor inside the floating panel allowing live visual tweak of element CSS properties directly in the page.
2. **AI Prompt Generator Workspace** (`Phase 3`): Generates structured LLM prompts containing HTML structure and CSS telemetry for copy-pasting into ChatGPT/Gemini/Claude.
3. **Natural Language Style Modification** (`Phase 3`): Connect to LLM API endpoints to modify component styling using natural language prompts (e.g. *"Make this button look modern with blue glassmorphism"*).
4. **Live Visual Code Diff View** (`Phase 3`): Side-by-side CSS diff viewer showing original vs AI-generated CSS rules before applying.
5. **Batch Component Matcher** (`Phase 4`): Identifies all identical UI components matching a selected element's CSS selector across the page and updates styles in batch.
