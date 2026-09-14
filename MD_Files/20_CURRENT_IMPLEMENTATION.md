# Qursor++ — Current Implementation Snapshot

Point. Inspect. Edit with AI. Generate. Build.

This document describes the current snapshot of the refactored **Qursor++** implementation.

---

## Architecture & Subsystem Snapshot

### 1. 🎨 Design Tokens & Dynamic Theme Engine (`utils/theme.js`)
- CSS Custom Properties (`DESIGN_TOKENS`) for Dark (`#0f172a`, `#1e293b`) and Light (`#ffffff`, `#f8fafc`) themes.
- Theme manager (`ThemeManager`) with `chrome.storage.sync` persistence, runtime broadcast, and real-time Shadow DOM styling.

### 2. ⚡ Toast Notification Subsystem (`utils/toast.js`)
- Renders non-intrusive floating toast notifications (`ToastManager`) inside Shadow DOM for copy, download, theme changes, and AI generation actions.

### 3. 🔍 Visual Inspection & Sub-Pixel Overlay (`content/overlay.js` / `content/inspector.js`)
- Hardware-accelerated hover highlights with tag dimension tooltips.
- Absolute document coordinate selection rectangle that locks to element during scrolling and window resizing, adorned with blue circular badge `1`.
- Isolated Shadow DOM root (`<website-inspector-root>`).

### 4. 🧠 Single Authoritative State Store (`utils/component_state.js`)
- Centralized `ComponentState` instance managing original element data, current modified HTML/CSS, active theme, zoom scale, selected format, asset filters, and LLM edit state.
- Pub/Sub subscriber architecture ensuring instant real-time synchronization between the Live Preview, Code generator, Edit LLM workflow, and telemetry tabs.

### 5. 🪟 Live Preview & Theme Canvas Isolation (`utils/preview_renderer.js`)
- Sandboxed iframe srcdoc rendering the extracted component with its exact styles.
- Strict canvas theme isolation: Dark mode forces canvas `#000000`, Light mode forces canvas `#FFFFFF`, while strictly preserving explicit component backgrounds (e.g. red buttons remain red).
- Dedicated zoom controls (`-`, `Fit`, `100%`, `+`).

### 6. 📊 Streamlined 9-Tab Panel Navigation (`content/panel.js`)
1. **Live**: Isolated iframe component preview with theme canvas isolation and zoom toolbar.
2. **Overview**: Element tag, dimensions, unique CSS selector, DOM depth, and quick actions.
3. **Typography**: Font family, font size, weight, line-height, letter-spacing, text align.
4. **Colors**: Text color, background color, border color, with interactive color swatches.
5. **Layout**: Interactive box model diagram (margin, padding, content) and flex/grid telemetry.
6. **Code**: Clean code generation strictly limited to two dedicated options: **HTML+CSS** and **React** (Tailwind JSX).
7. **Edit**: Natural language LLM component editor with prompt textarea, Apply, and Reset rollback.
8. **Assets**: Deep DOM subtree media scanner with YouTube thumbnail detection and format filter pills (`All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`).
9. **Settings**: AI model provider configuration (Gemini, OpenAI, OpenRouter, Groq), masked API key input (`••••••••••••1234`), and theme switcher.

### 7. 🤖 Multi-Provider LLM Service (`utils/llm_service.js`)
- Direct REST communication supporting Google Gemini, OpenAI, OpenRouter, and Groq.
- Masked API key storage in `chrome.storage.sync`.
- Structured JSON editing (`{ html, css, changes }`) with automatic state rollback on network/parsing failure.
- 1-click React component generation with AI.

### 8. ⚛️ React & Tailwind Synthesizer (`utils/component_generator.js` & `utils/tailwind_mapper.js`)
- Production-grade React functional components (`export default function Component(...)`) styled with Tailwind CSS utility classes and arbitrary brackets (`w-[347px]`).
- Automatic sanitization of YouTube Web Components (`<ytd-*>`, `<yt-*>`, `<tp-yt-*>`) into standard semantic HTML elements.
- Clean HTML+CSS code bundles. (Vue, Angular, and JS-only options have been completely purged).

### 9. 🎛️ Extension Popup Interface (`popup/`)
- Status card, inspect toggle button, Light/Dark/System theme switcher buttons, keyboard shortcuts card, updated feature badges (including `Edit`), and documentation links.
