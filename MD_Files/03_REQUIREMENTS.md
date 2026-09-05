# 03 - Requirements Matrix

## Functional Requirements (FR)

| ID | Category | Requirement Description | Implementation Status | Target Module |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Inspect Mode | User can toggle inspect mode using popup UI button or `Ctrl+Shift+I` (`Cmd+Shift+I`). | `Completed` | `background/background.js`, `popup/popup.js` |
| **FR-02** | Visual Overlay | Highlight hovered DOM elements with a blue bounding box and display tag, ID, class, and dimensions pill. | `Completed` | `content/overlay.js` |
| **FR-03** | Element Selection | Capture click events on elements without triggering page navigation or form submission (`e.preventDefault()`). | `Completed` | `content/inspector.js` |
| **FR-04** | Style Extraction | Read computed styles for layout, spacing, typography, colors, borders, flexbox, and grid layouts. | `Completed` | `utils/style.js`, `content/extractor.js` |
| **FR-05** | DOM Hierarchy | Compute tree depth from document root, parent tag/ID, child element count, and sibling tags. | `Completed` | `utils/dom.js` |
| **FR-06** | Selector Generation| Generate unique CSS Selectors and XPath queries for selected elements. | `Completed` | `utils/selector.js` |
| **FR-07** | Floating UI Panel | Display an interactive dark glassmorphic panel in Shadow DOM with 11 inspectable data tabs. | `Completed` | `content/panel.js` |
| **FR-08** | Movable UI | Allow users to drag the panel header anywhere on the screen with boundary safeguards. | `Completed` | `content/panel.js` |
| **FR-09** | Collapsible UI | Allow users to collapse the floating panel to a slim header title bar. | `Completed` | `content/panel.js` |
| **FR-10** | 1-Click Export | Provide 1-click clipboard buttons for structured JSON, clean HTML, outer HTML, CSS selectors, XPath, and computed CSS. | `Completed` | `utils/clipboard.js`, `content/panel.js` |
| **FR-11** | ESC Abort | Pressing `ESC` cancels active inspect mode and restores standard page cursor. | `Completed` | `content/inspector.js` |
| **FR-12** | Live Style Editing | Edit computed style properties inline in the floating panel for instant visual in-page updates. | `Planned` (Phase 3) | `content/panel.js` |
| **FR-13** | AI Prompt Workspace| Generate structured LLM prompt templates and process natural language UI modifications. | `Planned` (Phase 3) | `content/ai.js` |

---

## Non-Functional Requirements (NFR)

| ID | Category | Metric / Constraint | Verification Method |
| :--- | :--- | :--- | :--- |
| **NFR-01** | Style Encapsulation | 100% two-way CSS isolation via closed/open Shadow DOM root (`<website-inspector-root>`). | Inspected host DOM; no stylesheet leakage. |
| **NFR-02** | High Performance | Hover bounding box updates rendered within 60 FPS using `requestAnimationFrame`. | DevTools Performance tab profiling. |
| **NFR-03** | Low Memory Footprint | Total runtime memory overhead < 15 MB per tab context. | Chrome Task Manager. |
| **NFR-04** | Compatibility | Runs smoothly on modern Chromium browsers (Chrome, Edge, Brave, Opera) with MV3 support. | Cross-browser manual testing. |
| **NFR-05** | Security | Zero execution of unsafe string evaluation (`eval()`), strict CSP compliance. | Chrome Extension Security Scanner. |
