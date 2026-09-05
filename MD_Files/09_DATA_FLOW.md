# 09 - Data Flow Specification

## Step-by-Step Data Flow Architecture

The data lifecycle within **Qursor++** operates across four discrete stages: Activation → Inspection & Hovering → Element Capture & Analysis → Telemetry Rendering & Clipboard Export.

---

## Data Flow Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Popup as Popup UI (popup.js)
    participant Worker as Service Worker (background.js)
    participant Storage as Local Storage
    participant Engine as Inspector Engine (inspector.js)
    participant Overlay as Overlay Manager (overlay.js)
    participant Extractor as Extractor Engine (extractor.js)
    participant Panel as Info Panel (panel.js)
    participant Clip as Clipboard Utility (clipboard.js)

    %% Stage 1: Activation
    User->>Popup: Clicks "Enable Inspector" (or Ctrl+Shift+I)
    Popup->>Worker: sendMessage({ action: 'TOGGLE_INSPECT' })
    Worker->>Storage: set({ inspectModeActive: true })
    Worker->>Engine: sendMessage({ action: 'INSPECT_STATE_CHANGED', active: true })
    Engine->>Engine: enable() [Attaches capture mouse listeners]

    %% Stage 2: Hover Inspection
    User->>Engine: Moves cursor over webpage element
    Engine->>Engine: document.elementFromPoint(clientX, clientY)
    Engine->>Overlay: updateHover(targetElement)
    Overlay->>Overlay: requestAnimationFrame() position overlay & tooltip

    %% Stage 3: Element Selection & Analysis
    User->>Engine: Clicks target DOM element
    Engine->>Engine: e.preventDefault(); e.stopPropagation();
    Engine->>Overlay: updateSelected(targetElement)
    Engine->>Extractor: extractElementData(targetElement)
    Extractor->>Extractor: Computes styles, DOM depth, selectors, attributes
    Extractor-->>Engine: Returns complete JSON Telemetry Payload
    Engine->>Panel: updateData(payload)
    Engine->>Engine: disable() [Detaches inspect mode listeners]
    Engine->>Worker: sendMessage({ action: 'TOGGLE_INSPECT' })

    %% Stage 4: Rendering & Copy Export
    Panel->>Panel: renderTabContent() [Updates Shadow DOM tab view]
    User->>Panel: Clicks "📋 JSON" (or HTML/CSS copy button)
    Panel->>Clip: copyToClipboard(formattedString)
    Clip-->>Panel: Returns success boolean
    Panel->>Panel: showToast("Copied JSON!")
```

---

## Detailed Data Transformations

### 1. User Trigger → Active State Change
- Input: User click or keyboard shortcut `Ctrl+Shift+I`.
- Signal Payload: `{ action: "TOGGLE_INSPECT" }`
- Storage State: `{ inspectModeActive: true }`

### 2. Cursor Positioning → Visual Overlay Highlight
- Input: `MouseEvent` (`clientX`, `clientY`).
- Target Element Resolution: `document.elementFromPoint(e.clientX, e.clientY)`.
- Filter Check: If `target.closest('#website-inspector-root')`, ignore (prevents hovering inspector UI itself).
- Overlay Update: `getBoundingClientRect()` calculates exact sub-pixel dimensions (`width`, `height`, `top`, `left`).

### 3. Click Interception → Analysis Engine (`extractElementData`)
- Event Phase: Capture Phase (`useCapture: true`).
- Action: Call `e.preventDefault()` and `e.stopPropagation()` to stop native link clicks or form submissions.
- Data Extraction Pipeline:
  1. `getCssSelector(target)`: Constructs clean CSS path.
  2. `getXPath(target)`: Constructs unique XPath string.
  3. `getDomHierarchy(target)`: Recursively calculates parent node, sibling tags, and node depth level.
  4. `extractComputedStyles(target)`: Invokes `window.getComputedStyle(target)` and groups into layout, spacing, typography, colors, borders, flex/grid.
  5. `rgbToHex()`: Converts RGB color values to Hex color strings.

### 4. Inspector Panel Rendering & Clipboard Export
- Presentation Target: Rendered directly inside Shadow DOM `#panelBody`.
- Tab Filter: Dynamic rendering based on `activeTab` property.
- Clipboard Action: Click event on toolbar button copies formatted target string (`JSON.stringify`, `innerHTML`, `outerHTML`, `selector`, `xpath`, or `rawCss`) to system clipboard.
