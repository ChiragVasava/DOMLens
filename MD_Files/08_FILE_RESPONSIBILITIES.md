# Qursor++ — File Responsibilities & Modules

This document details the exact responsibilities of every file in the **Qursor++** codebase.

---

## Workspace Modules Breakdown

### 1. `manifest.json`
- **Purpose**: Chrome Extension Manifest V3 configuration.
- **Responsibilities**: Service Worker (`background/background.js`), Content Script loader (`content/loader.js`), keyboard shortcuts (`Ctrl+Shift+I`), permissions (`activeTab`, `scripting`, `storage`), popup interface, and web-accessible resources (`utils/*.js`).

### 2. `background/background.js`
- **Purpose**: Service Worker state orchestrator.
- **Responsibilities**: Manages inspect mode state, handles keyboard commands (`toggle-inspect-mode`), communicates state and theme changes to active tabs via Chrome runtime messaging, and syncs `chrome.storage.sync` preferences.

### 3. `content/loader.js`
- **Purpose**: Dynamic ES Module content script loader.
- **Responsibilities**: Imports `content/inspector.js` into active tab context.

### 4. `content/inspector.js`
- **Purpose**: Main content script orchestrator (`QursorEngine`).
- **Responsibilities**: Listens to mouse movements, intercepts capture-phase clicks (`e.preventDefault()`), handles `ESC` cancellation, passes DOM element target to `InspectorOverlay` and `InspectorPanel`, and listens to `ACTIONS.THEME_CHANGED` messages.

### 5. `content/overlay.js`
- **Purpose**: Visual overlay highlight engine (`InspectorOverlay`).
- **Responsibilities**: Manages hover bounding boxes, scroll-locked selection box with **circular blue badge `1`**, Qursor hover details card, and Shadow DOM root (`<website-inspector-root>`).

### 6. `content/panel.js`
- **Purpose**: Floating Information Panel UI (`InspectorPanel`).
- **Responsibilities**: Re-architects all 7 ordered feature tabs: Live Preview with Zoom Controls (-/Fit/100%/+), Overview (2nd feature), Code export filters (HTML, CSS, JS, HTML+CSS+JS, React, Vue, Angular, Tailwind), Edit (natural language CSS parser & style editor), Assets (subtree media scanner & YouTube thumbnails), AI Prompt builder, and Settings.

### 7. `content/extractor.js`
- **Purpose**: Element Data Extractor (`extractElementData`).
- **Responsibilities**: Aggregates computed CSS styles, box model spacing, typography, colors, borders, flexbox/grid telemetry, accessibility ARIA attributes, SVG graphics, YouTube thumbnail sources, and DOM depth levels.

### 8. `utils/asset_extractor.js` [NEW]
- **Purpose**: Comprehensive Asset Extractor Engine (`extractElementAssets`, `filterAssets`).
- **Responsibilities**: Scans selected element and entire child DOM subtree for images (`<img>`, `srcset`, `data-src`, `data-thumb`), CSS background-images (`url(...)`), inline/external SVGs, and videos. Provides filtering by `All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`.

### 9. `utils/style_editor.js` [NEW]
- **Purpose**: Interactive Style Editor & Instruction Parser (`StyleEditor`).
- **Responsibilities**: Parses natural language CSS instructions (e.g., "make background blue", "set font size to 24px") and direct property inputs to mutate component styles and live preview re-rendering.

### 10. `utils/theme.js`
- **Purpose**: Centralized Theme Manager (`ThemeManager`).
- **Responsibilities**: Defines CSS Custom Properties for Dark and Light themes (`DESIGN_TOKENS`), manages `chrome.storage.sync` theme preferences, and applies themes dynamically to Shadow DOM host and panel container.

### 11. `utils/toast.js`
- **Purpose**: Action Feedback Toast Manager (`ToastManager`).
- **Responsibilities**: Renders smooth, non-intrusive floating toast notifications inside Shadow DOM for copy, download, and theme changes.

### 12. `utils/component_generator.js`
- **Purpose**: Multi-Framework & Isolated Code Generator (`generateComponentCode`).
- **Responsibilities**: Synthesizes clean code snippets for HTML Only, CSS Only, JS Only, HTML+CSS+JS, React JSX, Vue 3 SFC, Angular Component, and Tailwind CSS HTML.

### 13. `utils/prompt_generator.js`
- **Purpose**: AI Prompt Generator (`generateStructuredAiPrompt`).
- **Responsibilities**: Formats structured, contextual AI prompts for LLM coding agents (Cursor, Claude, Antigravity, ChatGPT).

### 14. `popup/popup.html` / `popup/popup.css` / `popup/popup.js`
- **Purpose**: Extension toolbar popup UI.
- **Responsibilities**: Renders status card, inspect toggle button, Light/Dark theme switcher buttons, keyboard shortcuts card, feature badges, and documentation links.
