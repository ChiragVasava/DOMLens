# Qursor++ — File Responsibilities & Modules

This document details the exact responsibilities of every file in the **Qursor++** codebase.

---

## Workspace Modules Breakdown

### 1. `manifest.json`
- **Purpose**: Chrome Extension Manifest V3 configuration.
- **Responsibilities**: Registers Service Worker (`background/background.js`), Content Script loader (`content/loader.js`), keyboard shortcuts (`Ctrl+Shift+I`), permissions (`activeTab`, `scripting`, `storage`), popup interface, and web-accessible resources (`utils/*.js`, `content/*.js`).

### 2. `background/background.js`
- **Purpose**: Service Worker state orchestrator.
- **Responsibilities**: Manages global inspect toggle state, handles keyboard commands (`toggle-inspect-mode`), communicates state changes to active tab content scripts, and syncs Chrome Storage preferences.

### 3. `content/loader.js`
- **Purpose**: Dynamic ES Module content script loader.
- **Responsibilities**: Imports `content/inspector.js` into active tab context using `chrome.runtime.getURL`.

### 4. `content/inspector.js`
- **Purpose**: Main content script orchestrator (`QursorEngine`).
- **Responsibilities**: Listens to mouse movements, intercepts clicks in capture phase (`e.preventDefault()`), handles `ESC` cancellation, updates `InspectorOverlay` and `InspectorPanel`, and listens to state/theme change messages.

### 5. `content/overlay.js`
- **Purpose**: Sub-pixel visual overlay highlight engine (`InspectorOverlay`).
- **Responsibilities**: Manages hover bounding boxes, scroll-locked green selection boxes, tag dimension tooltips, and Shadow DOM root (`<website-inspector-root>`).

### 6. `content/panel.js`
- **Purpose**: Floating Information Panel UI (`InspectorPanel`).
- **Responsibilities**: Movable, resizable, collapsible dark/light floating panel featuring 12 developer-focused data tabs, theme toggle, framework code preview editor, AI prompt builder editor, file download, and quick copy toolbar.

### 7. `content/extractor.js`
- **Purpose**: Element Data Extractor (`extractElementData`).
- **Responsibilities**: Aggregates computed CSS styles, box model spacing, typography, colors, borders, flexbox/grid telemetry, accessibility ARIA attributes, SVG graphics, and DOM depth levels.

### 8. `utils/theme.js` [NEW]
- **Purpose**: Theme & Design Token Manager (`ThemeManager`).
- **Responsibilities**: Defines CSS Custom Properties for Dark and Light themes (`DESIGN_TOKENS`), manages `chrome.storage.sync` theme preference, and applies themes dynamically to Shadow DOM and popup.

### 9. `utils/toast.js` [NEW]
- **Purpose**: Action Feedback Toast Manager (`ToastManager`).
- **Responsibilities**: Renders smooth, non-intrusive floating toast feedback inside Shadow DOM for copy and download confirmation.

### 10. `utils/tailwind_mapper.js` [NEW]
- **Purpose**: Computed CSS to Tailwind Utility Class Mapper (`mapStylesToTailwind`).
- **Responsibilities**: Converts computed CSS declarations (display, padding, margin, flex, typography, colors, borders, radii, shadows) into standard Tailwind CSS utility classes.

### 11. `utils/component_generator.js` [NEW]
- **Purpose**: Multi-Framework Component Generator (`generateComponentCode`).
- **Responsibilities**: Synthesizes clean reusable component snippets for React JSX, Vue 3 SFC, Angular Component, Tailwind CSS, Vanilla HTML/CSS/JS, and Clean HTML.

### 12. `utils/prompt_generator.js` [NEW]
- **Purpose**: AI Prompt Generator (`generateStructuredAiPrompt`).
- **Responsibilities**: Formats structured, contextual AI prompts for LLM coding assistants (Cursor, Claude, Antigravity, ChatGPT), including target specs, DOM hierarchy, styling, layout, assets, responsive behavior, interaction states, and AI requirements.

### 13. `utils/constants.js`
- **Purpose**: Centralized constant definitions (`ACTIONS`, `INSPECTOR_STATE`, `PANEL_TABS`, `OVERLAY_STYLES`).

### 14. `utils/dom.js` / `utils/selector.js` / `utils/style.js` / `utils/clipboard.js`
- **Purpose**: Core helper utilities for DOM hierarchy traversal, CSS selector generation, XPath creation, computed style extraction, and clipboard operations.

### 15. `popup/popup.html` / `popup/popup.css` / `popup/popup.js`
- **Purpose**: Extension toolbar popup UI.
- **Responsibilities**: Renders developer-tool status card, inspect toggle button, Light/Dark theme switcher, keyboard shortcuts card, and documentation link.
