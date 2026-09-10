# Qursor++ — Release Changelog

All notable changes to **Qursor++** are documented in this file.

---

## [1.1.0] - Master Audit, Stabilization & Complete Feature Suite

### 🚀 Core Architecture Fixes & Stabilization
- **Synchronized Theme System (`utils/theme.js`)**: Fixed Popup & Panel theme synchronization. Theme changes in Settings or Popup instantly update all extension UIs and persist in `chrome.storage.sync`.
- **Isolated Preview Styling**: Fixed text color bug where extension UI tokens previously overwrote inspected component preview styles. Components now preserve 100% of their original computed colors, fonts, background colors, and dimensions.
- **Working Live Preview Zoom Controls**: Restored zoom controls (`-`, `Fit`, `100%`, `+`, `Reset`) with scaling from **15%** to **300%** and dynamic scale percentage badges (`80%`).
- **Separated Code Export Formats (`utils/component_generator.js`)**: Added explicit export options for:
  - **HTML ONLY** (Pure clean HTML snippet)
  - **CSS ONLY** (Pure computed CSS declarations block)
  - **JAVASCRIPT ONLY** (Pure event listener logic snippet)
  - **HTML + CSS + JAVASCRIPT** (Complete standalone single bundle)
  - **Framework Targets** (React JSX, Vue 3 SFC, Angular, Tailwind CSS HTML).
- **YouTube Thumbnail & Media Intelligence (`content/extractor.js`)**: Extracted thumbnails and media sources from YouTube playlist items, `<ytd-thumbnail>`, `<img>` tags (`src`, `srcset`, `data-src`, `data-thumb`), and CSS `background-image: url(...)`.
- **Subtree Asset Scanner & Filter (`utils/asset_extractor.js`)**: Created asset extractor scanning element and child subtree. Features working filters: `All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other` with preview cards, URL copy, and 1-click download.
- **Interactive Style Editor & Natural Language CSS Parser (`utils/style_editor.js`)**: Implemented natural language CSS instruction parser (e.g. `"Make background blue"`, `"Set font size to 24px"`) and direct style inputs. Edits immediately mutate live component preview and reflect in code output.
- **Ordered Navigation Architecture**: Re-architected panel feature order to:
  1. `Live` (Live Preview & Zoom)
  2. `Overview` (2nd Feature: Detailed Element Metrics)
  3. `Code` (HTML, CSS, JS, HTML+CSS+JS, React, Vue, Angular, Tailwind)
  4. `Edit` (Instruction Parser & Style Editor)
  5. `Assets` (Subtree Media Scanner)
  6. `Prompt` (AI Prompt Generator)
  7. `Settings` (Theme Switcher & Preferences)
- **Scope & Scope Extraction**: Added working `Selected` vs `Full Page` DOM extraction.
