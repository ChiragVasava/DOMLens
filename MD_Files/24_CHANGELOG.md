# 24 - Project Changelog

## Release History

All notable changes to the **Qursor++ (DOMLens)** project will be documented in this file.

---

## [1.0.0] - 2026-09-05 (Phase 1 & Phase 2 Complete)

### Added
- **Chrome Extension Manifest V3 Architecture**:
  - Event-driven background service worker (`background/background.js`).
  - Dynamic module loader (`content/loader.js`) overcoming MV3 content script import constraints.
  - Storage state synchronization via `chrome.storage.local`.
  - Global hotkey shortcut `Ctrl+Shift+I` / `Cmd+Shift+I`.
- **Encapsulated Shadow DOM Root (`<website-inspector-root>`)**:
  - 100% style isolation ensuring extension styles never leak into host webpage DOM.
- **Visual Overlay Highlights (`content/overlay.js`)**:
  - Sub-pixel hover bounding box highlights.
  - Floating tag dimension tooltips (`<tag#id.class width×height>`).
  - Throttle updates using `requestAnimationFrame`.
  - Capture-phase click interceptor preventing default page action execution (`e.preventDefault()`, `e.stopPropagation()`).
  - `ESC` keyboard handler to exit inspect mode instantly.
- **Movable, Resizable 11-Tab Inspector Panel (`content/panel.js`)**:
  - Movable header with boundary limits.
  - Collapsible window state.
  - 11 dedicated data tabs (*General, Layout, Typography, Colors, Spacing, Border, Flex & Grid, DOM, Attributes, HTML, CSS*).
  - Clean HTML & CSS monospaced code blocks.
- **Analytical Data Extractor (`content/extractor.js`)**:
  - Computed style parser for layout, spacing, typography, colors, border, flex/grid.
  - Dual RGB-to-Hex color string converter.
  - DOM depth tree level calculator (`utils/dom.js`).
  - Unique CSS Selector path generator (`utils/selector.js`).
  - Precise XPath string builder (`utils/selector.js`).
  - Specialized attribute extractors for Images, Links, Buttons, and Inputs.
- **1-Click DevTools Clipboard Copier (`utils/clipboard.js`)**:
  - 1-click quick action export buttons for JSON, HTML, OuterHTML, Selector, XPath, and CSS.
  - Animated top-center toast feedback notification.
  - Dual-layer clipboard writer with off-screen `document.execCommand('copy')` fallback.
- **Extension Popup Controller (`popup/`)**:
  - Dark mode glassmorphic interface with active status indicator pill.
  - Toggle button and shortcut cheat-sheet.

---

## Initial Project Setup - 2026-07-31

- Project repository initialization (formerly DOMLens / Qursor++).
- Setup of baseline directory layout, assets, icons, and `README.md`.
