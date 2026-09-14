# Qursor++ — File Responsibilities & Modules

This document details the exact architectural responsibilities of every file in the refactored **Qursor++** codebase.

---

## Workspace Modules Breakdown

### 1. `manifest.json`
- **Purpose**: Chrome Extension Manifest V3 configuration.
- **Responsibilities**: Service Worker (`background/background.js`), Content Script loader (`content/loader.js`), keyboard shortcut commands (`toggle-inspect-mode`), permissions (`activeTab`, `scripting`, `storage`), popup interface, and web-accessible resources (`utils/*.js`).

### 2. `background/background.js`
- **Purpose**: MV3 Service Worker state orchestrator.
- **Responsibilities**: Manages global inspect mode state, handles keyboard commands (`toggle-inspect-mode`), coordinates state and theme changes to active tabs via Chrome runtime messaging, and syncs `chrome.storage.sync` preferences.

### 3. `content/loader.js`
- **Purpose**: Dynamic ES Module content script loader.
- **Responsibilities**: Dynamically imports `content/inspector.js` into the active tab context.

### 4. `content/inspector.js`
- **Purpose**: Main content script orchestrator (`QursorEngine`).
- **Responsibilities**: Intercepts pointer movements during inspection, catches capture-phase clicks (`e.preventDefault()`, `e.stopPropagation()`), manages `Escape` cancellation, initializes `ComponentState` on click, feeds extracted telemetry to `InspectorOverlay` and `InspectorPanel`, and coordinates `ACTIONS.THEME_CHANGED` events.

### 5. `content/overlay.js`
- **Purpose**: Visual overlay highlight engine (`InspectorOverlay`).
- **Responsibilities**: Renders hover bounding box, scroll-locked selection box with blue circular badge `1`, floating inspection details card, and isolates all extension UI inside a closed Shadow DOM (`<website-inspector-root>`).

### 6. `content/panel.js`
- **Purpose**: Floating Information Panel UI (`InspectorPanel`).
- **Responsibilities**:
  - Manages the floating Shadow DOM panel with robust drag handling (drags only while mouse button is held, never aborts when cursor leaves container).
  - Renders the exact 9 navigation tabs:
    1. `Live`: Isolated iframe preview with `#000000` / `#FFFFFF` canvas theme isolation and zoom controls (-/Fit/100%/+).
    2. `Overview`: Element tag, dimensions, selectors, DOM depth, and quick action buttons.
    3. `Typography`: Font family, font size, weight, line-height, letter-spacing, text align.
    4. `Colors`: Text color, background color, border color with visual color swatch pills.
    5. `Layout`: Interactive box model diagram (margin, padding, content) and flex/grid telemetry.
    6. `Code`: Code generation strictly containing two options: **HTML+CSS** and **React** (Tailwind JSX).
    7. `Edit`: Natural language LLM component editor with prompt textarea, Apply, and Reset rollback.
    8. `Assets`: Deep DOM subtree media scanner with YouTube thumbnail detection and format filter pills.
    9. `Settings`: AI model provider configuration (Gemini, OpenAI, OpenRouter, Groq), masked API key input, and theme selector.

### 7. `content/extractor.js`
- **Purpose**: Element Data Extractor (`extractElementData`).
- **Responsibilities**: Aggregates computed CSS styles, box model spacing, typography, colors, borders, flexbox/grid telemetry, accessibility ARIA attributes, SVG graphics, YouTube thumbnail sources, and DOM depth levels. (XPath extraction has been completely purged).

### 8. `utils/component_state.js`
- **Purpose**: Centralized Reactive State Store (`ComponentState`).
- **Responsibilities**: Maintains single authoritative model for `{ original, current, selectedElement, theme, zoom, activeTab, codeFormat, assetFilter, editState }`. Provides pub/sub listener notification to ensure all tabs synchronize instantaneously without stale state.

### 9. `utils/preview_renderer.js`
- **Purpose**: Live Preview Isolated Document Builder (`buildLivePreviewDoc`).
- **Responsibilities**: Synthesizes a sandboxed HTML iframe document with clean CSS resets, component style extraction, and strict background isolation: Dark theme forces `#000000` canvas background, Light theme forces `#FFFFFF` canvas background, while strictly preserving explicit component background colors.

### 10. `utils/llm_service.js`
- **Purpose**: Multi-Provider LLM Integration Service.
- **Responsibilities**:
  - Provides unified REST communication for Google Gemini, OpenAI, OpenRouter, and Groq.
  - Manages API key persistence via `chrome.storage.sync` with display masking (`••••••••••••1234`).
  - Implements `callLlmEditComponent` with structured JSON schema `{ html, css, changes }` and markdown code fence extraction fallback.
  - Implements `callLlmGenerateReact` for production-grade React components styled with Tailwind CSS.
  - Handles request timeouts via `AbortController`.

### 11. `utils/component_generator.js`
- **Purpose**: React JSX & HTML+CSS Code Generator (`generateComponentCode`).
- **Responsibilities**: Synthesizes standalone React functional components (`export default function Component(...)`) styled with Tailwind CSS classes and arbitrary value brackets (`w-[347px]`). Automatically converts YouTube Web Components (`<ytd-*>`, `<yt-*>`) into standard semantic HTML elements. Synthesizes clean HTML+CSS code bundles. (Vue, Angular, and JS-only formats have been completely purged).

### 12. `utils/tailwind_mapper.js`
- **Purpose**: CSS-to-Tailwind Utility Mapper (`mapStylesToTailwind`).
- **Responsibilities**: Converts computed CSS properties (dimensions, flex, grid, colors, fonts, margins, paddings, borders, shadows) into standard Tailwind CSS utility classes and arbitrary values (`bg-[#123456]`, `w-[350px]`).

### 13. `utils/asset_extractor.js`
- **Purpose**: Media Scanner & Format Classifier (`extractElementAssets`).
- **Responsibilities**: Scans selected element and entire child DOM subtree for `<img>`, `<picture>`, `<source>`, inline SVGs, CSS `background-image`, and HTML5 `<video>`. Resolves relative URLs against `document.baseURI`. Provides format filters (`All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`).

### 14. `utils/theme.js`
- **Purpose**: Centralized Theme Manager (`ThemeManager`).
- **Responsibilities**: Defines CSS Custom Properties for Dark and Light themes (`DESIGN_TOKENS`), manages `chrome.storage.sync` theme preferences, and applies themes dynamically to Shadow DOM host and panel container.

### 15. `utils/toast.js`
- **Purpose**: Action Feedback Toast Manager (`ToastManager`).
- **Responsibilities**: Renders smooth, non-intrusive floating toast notifications inside Shadow DOM for copy, download, AI generation, and theme changes.

### 16. `utils/selector.js`
- **Purpose**: CSS Selector Generator (`getUniqueSelector`).
- **Responsibilities**: Computes clean, deterministic CSS selectors (ID, class, attribute, hierarchy). XPath generation has been completely removed.

### 17. `utils/constants.js`
- **Purpose**: Global configuration constants and action keys.
- **Responsibilities**: Defines `QURSOR_NAV_TABS` (the 9 final tabs), `ACTIONS`, `THEMES`, and default storage values.

### 18. `popup/popup.html` / `popup/popup.css` / `popup/popup.js`
- **Purpose**: Extension toolbar popup UI.
- **Responsibilities**: Renders status card, inspect toggle button, Light/Dark/System theme switcher buttons, keyboard shortcuts card, updated feature badges (including `Edit`), and documentation links.
