# Qursor++ — Release Changelog

All notable changes to **Qursor++** are documented in this file.

---

## [2.0.0] - Full Codebase Recovery, Refactor & Feature Completion

### 🚀 Architecture & State Management
- **Centralized Reactive State (`utils/component_state.js`)**: Built a single authoritative state model (`ComponentState`) that synchronizes all panel tabs, eliminating stale state across Live Preview, Code, Edit, and telemetry views.
- **Isolated Iframe Live Preview (`utils/preview_renderer.js`)**: Implemented isolated iframe `srcdoc` rendering with strict canvas background isolation (`#000000` for Dark theme, `#FFFFFF` for Light theme) while strictly preserving explicit component backgrounds (e.g. red buttons retain explicit red background).
- **Smooth Drag Engine**: Fixed mouse dragging lifecycle to track window-level `mousemove` and `mouseup` events on `mousedown`. Eliminated premature drag aborts when the cursor moves outside the panel boundaries.
- **Purged Obsolete Features**:
  - Completely removed DOM Tree tab, standalone HTML tab, and AI Prompt tab.
  - Completely eliminated all XPath generation routines and comments from `utils/selector.js`, `content/extractor.js`, and documentation schemas.
  - Purged Vue, Angular, CSS-only, JS-only, and Full Page scope options.

### ⚛️ Code Synthesizer (Strictly HTML+CSS & React)
- **Constrained Code Options**: Code tab now strictly presents two options: **HTML+CSS** and **React**.
- **Production React Component Generator (`utils/component_generator.js`)**:
  - Synthesizes clean functional React components (`export default function Component(...)`) styled with Tailwind CSS utility classes and arbitrary brackets (`w-[347px]`).
  - Converts non-standard YouTube Web Components (`<ytd-*>`, `<yt-*>`, `<tp-yt-*>`) into standard semantic HTML elements (`div`, `nav`, `main`, `header`, `article`, `button`, `span`).
  - Converts HTML attributes to React JSX conventions (`class` → `className`, `style` strings → React style objects, boolean attributes).
- **1-Click AI React Generation**: Integrated "⚡ Generate with AI" button in the Code tab when an API key is configured.

### 💬 Edit Tab (Natural Language LLM Workflow)
- **Natural Language Instruction Input**: Users can enter plain English modifications (e.g. *"Make the background blue, increase padding to 20px, make the text bold"*).
- **Structured JSON Contract**: Communicates with multi-provider LLM service expecting `{ html, css, changes }` with fallback regex for markdown code fences.
- **Instant Live Synchronization**: Applying edits immediately updates the authoritative state model, re-rendering the Live Preview and updating the Code tab.
- **Robust Error Handling & Rollback**: If an LLM call fails or times out, the previous component state is strictly preserved and an error message is displayed.
- **1-Click Reset**: Restores the component to its original captured state.

### ⚙️ Settings Tab & Multi-Provider AI Engine
- **Multi-Provider LLM Integration (`utils/llm_service.js`)**: Supports Google Gemini, OpenAI, OpenRouter, and Groq via clean REST endpoints.
- **Secure Masked API Key Storage**: Stored in `chrome.storage.sync` with masked UI display (`••••••••••••1234`).
- **AI Status Pill**: Displays real-time configuration status (`Ready ⚡` vs `No Key ⚠️`).
- **Unified Theme Synchronization**: Synchronizes Dark, Light, and System themes across Popup, Settings, and Inspector Panel.

### 🖼️ Deep Asset Scanner (`utils/asset_extractor.js`)
- Scans `<img>`, `<picture>`, `<source>`, inline SVGs, CSS `background-image`, and HTML5 `<video>` across the selected DOM subtree.
- Extracts high-resolution YouTube thumbnails from video cards and playlist items.
- Provides interactive format filter tabs: `All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`.
