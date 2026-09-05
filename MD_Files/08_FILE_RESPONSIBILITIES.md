# 08 - File Responsibilities & Symbol Index

An exhaustive specification of every file in the project workspace, including exported classes, functions, dependencies, and operational roles.

---

## Root Configuration Files

### 1. [`manifest.json`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/manifest.json)
- **Purpose**: Defines Chrome Extension Manifest V3 configuration, permissions, background worker declaration, content script entry points, web-accessible resources, and keyboard shortcuts.
- **Key Fields**: `permissions: ["activeTab", "scripting", "storage"]`, `commands: { toggle-inspect-mode }`.
- **Dependencies**: None.

---

## Extension Background Layer (`background/`)

### 2. [`background/background.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/background/background.js)
- **Purpose**: MV3 Service Worker managing inspect active state, processing commands, and dispatching tab messages.
- **Exported Symbols / Main Functions**:
  - `toggleTabInspectMode(tabId, sendResponse)`: Toggles active state in `chrome.storage.local` and sends state to tab.
  - Event listeners: `chrome.runtime.onInstalled`, `chrome.commands.onCommand`, `chrome.runtime.onMessage`.
- **Dependencies**: Imports `ACTIONS` from `utils/constants.js`.

---

## Content Scripts Layer (`content/`)

### 3. [`content/loader.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/content/loader.js)
- **Purpose**: Dynamic loader content script. Bypasses MV3 content script module limitations by executing dynamic `import()` of `content/inspector.js`.
- **Dependencies**: Resolves URL via `chrome.runtime.getURL('content/inspector.js')`.

### 4. [`content/inspector.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/content/inspector.js)
- **Purpose**: Master Content Script Orchestrator & State Machine (`DOMLensEngine`).
- **Main Class**: `DOMLensEngine`
  - `init()`: Instantiates `InspectorOverlay` and `InspectorPanel`.
  - `enable()`: Attaches capture-phase listeners (`mousemove`, `click`, `keydown`).
  - `disable()`: Detaches capture-phase listeners and clears highlights.
  - `handleMouseMove(e)`: Tracks hover targets via `document.elementFromPoint`.
  - `handleClick(e)`: Intercepts click (`e.preventDefault()`, `e.stopPropagation()`), extracts data, and updates panel.
  - `handleKeyDown(e)`: Cancels inspect mode on `ESC`.
- **Dependencies**: Imports `ACTIONS`, `extractElementData`, `InspectorOverlay`, `InspectorPanel`.

### 5. [`content/overlay.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/content/overlay.js)
- **Purpose**: Renders visual hover overlays, bounding boxes, and dimension tooltips inside Shadow DOM.
- **Main Class**: `InspectorOverlay`
  - `initShadowDom()`: Creates `<website-inspector-root>` and attaches Shadow Root.
  - `updateHover(element)`: Renders sub-pixel hover box and dimension tooltip using `requestAnimationFrame`.
  - `updateSelected(element)`: Renders green selected box on target element.
  - `hideHover()`, `hideAll()`: Clears overlay elements.
- **Dependencies**: Imports `OVERLAY_STYLES` from `utils/constants.js`.

### 6. [`content/panel.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/content/panel.js)
- **Purpose**: movable, resizable, collapsible dark glassmorphic floating UI panel with 11 inspectable tabs.
- **Main Class**: `InspectorPanel`
  - `createPanelDOM()`: Constructs panel HTML structure and scoped CSS in Shadow DOM.
  - `attachEventListeners()`: Header drag, collapse button, tab switching, and clipboard actions.
  - `updateData(data)`: Updates panel content with element analysis telemetry.
  - `renderTabContent()`: Renders active tab view (`general`, `layout`, `typography`, `colors`, `spacing`, `border`, `flex`, `dom`, `attributes`, `html`, `css`).
  - `showToast(msg)`: Displays animated copy feedback toast.
- **Dependencies**: Imports `PANEL_TABS`, `copyToClipboard`.

### 7. [`content/extractor.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/content/extractor.js)
- **Purpose**: Master analytical data extraction engine assembling full DOM metrics and style objects.
- **Main Functions**:
  - `extractElementData(element)`: Assembles complete inspection payload.
  - `extractAriaAttributes(element)`: Collects `aria-*` attribute map.
  - `extractSpecializedDetails(element, tag)`: Collects details for `img`, `a`, `button`, and `input` tags.
- **Dependencies**: Imports `getCssSelector`, `getXPath`, `getDomHierarchy`, `getElementAttributes`, `getCleanTextContent`, `extractComputedStyles`, `getRawCssString`.

---

## Helper Utilities Layer (`utils/`)

### 8. [`utils/constants.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/utils/constants.js)
- **Exports**: `ACTIONS`, `INSPECTOR_STATE`, `PANEL_TABS`, `OVERLAY_STYLES`.

### 9. [`utils/selector.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/utils/selector.js)
- **Exports**:
  - `getCssSelector(element)`: Generates unique CSS Selector path.
  - `getXPath(element)`: Generates precise XPath string.

### 10. [`utils/dom.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/utils/dom.js)
- **Exports**:
  - `getElementDepth(element)`: Calculates tree depth relative to document root.
  - `getDomHierarchy(element)`: Returns parent, sibling, child tag, and depth details.
  - `getElementAttributes(element)`: Maps all HTML attributes to key-value object.
  - `getCleanTextContent(element, maxLength)`: Safe string summarizer.

### 11. [`utils/style.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/utils/style.js)
- **Exports**:
  - `rgbToHex(rgbStr)`: Converts `rgb()` / `rgba()` to Hex string (`#rrggbb` / `#rrggbbaa`).
  - `extractComputedStyles(element)`: Returns grouped computed styles.
  - `getRawCssString(element)`: Formats computed style rules as CSS code block.

### 12. [`utils/clipboard.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/utils/clipboard.js)
- **Exports**: `copyToClipboard(text)`: Async clipboard write with `document.execCommand('copy')` fallback.

---

## Popup & Helper Layer (`popup/` & `scripts/`)

### 13. [`popup/popup.html`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/popup/popup.html) / [`popup.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/popup/popup.js) / [`popup.css`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/popup/popup.css)
- **Purpose**: Extension toolbar popup UI for toggling inspector state and opening documentation.

### 14. [`scripts/generate_icons.js`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/scripts/generate_icons.js)
- **Purpose**: Node canvas script generating extension icons (`16x16`, `48x48`, `128x128`).
