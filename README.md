# Qursor++ (DOMLens) 🔍

> **A Production-Grade Visual HTML Inspector, Computed Style Analyzer & DevTools Assistant Chrome Extension.**

Qursor++ is a lightweight, high-precision Chrome Extension (Manifest V3) that allows developers, UI engineers, QA automation testers, and AI workflows to visually inspect any HTML element on **ANY website**, extract complete computed styles, box model dimensions, typography, color codes, and DOM hierarchy metrics, and export DevTools-grade data in 1-click.

Designed specifically as an **AI-assisted development companion**, Qursor++ enables instant copying of structured JSON payloads, CSS Selectors, XPaths, HTML snippets, and computed CSS rules ready to feed directly into AI coding assistants (such as ChatGPT, Claude, Gemini, or GitHub Copilot).

---

## 🚀 Key Features (Phase 1 & Phase 2 Completed)

- 🎯 **Visual Element Picking**: Hovering highlights any HTML element with a hardware-accelerated blue outline and a sub-pixel floating tooltip showing tag name, ID, classes, and pixel dimensions.
- ⚡ **Zero-Leakage Shadow DOM Encapsulation**: Overlays and inspector UI render inside `<website-inspector-root>` using Shadow DOM to guarantee zero style leakage or page visual distortion.
- 📊 **11 Interactive Inspector Tabs**:
  - **General**: Tag name, ID, class list, text content, input value, ARIA role, disabled/required state.
  - **Layout**: Width, height, bounding top/left/bottom/right coordinates, display, position, overflow, visibility, opacity, z-index, box-sizing.
  - **Typography**: Font family, font size, font weight, line height, letter spacing, text align, text transform, text decoration.
  - **Colors**: Text color, background color, border color, outline color, box shadow with dual RGB-to-Hex conversion.
  - **Spacing**: Box model margin, padding, and layout gap values.
  - **Border**: Border width, border radius, border style, border color.
  - **Flex & Grid**: Direction, justify content, align items, flex wrap, grid template columns/rows, gap.
  - **DOM Hierarchy**: Parent tag/ID, child count, child tags, previous/next sibling tags, DOM depth tree level, CSS selector, XPath.
  - **Attributes**: Key-value dictionary of all HTML attributes present on the node.
  - **HTML View**: Formatted outerHTML and innerHTML code block.
  - **CSS View**: Formatted computed CSS rule block.
  - **Specialized Element Intelligence**: Natural vs displayed dimensions for images, target/rel for links, form/button types, input properties.
- 🎛️ **Interactive Dark Glassmorphism Panel**: Movable (drag header), resizable, collapsible, dark-mode panel rendered in Shadow DOM.
- 📋 **1-Click DevTools Export**: Export JSON, HTML, OuterHTML, CSS Selector, XPath, or raw CSS rules directly to system clipboard with animated toast feedback.

---

## 🛠️ Technology Stack

| Layer | Technology | Specification / Standard |
| :--- | :--- | :--- |
| **Extension Platform** | Chrome Extension Manifest V3 | Service Worker Architecture (`manifest_version: 3`) |
| **Logic & Subsystems** | Vanilla ES2023 JavaScript | Native ES Modules (`import`/`export`) |
| **UI & Styling** | HTML5 & Vanilla CSS3 | Custom CSS Variables, Glassmorphism dark theme |
| **DOM Isolation** | Shadow DOM API | Encapsulated root (`<website-inspector-root>`) |
| **Build System** | Zero External Bundlers | Raw JavaScript / Native DOM APIs |

> 🚫 **Zero External Dependencies**: No React, No Vue, No jQuery, No TailwindCSS, No Bootstrap, No Node.js runtime required for execution.

---

## 📚 Complete Project Documentation (`MD_Files/`)

The repository contains an exhaustive 24-file technical documentation suite inside [`MD_Files/`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/MD_Files):

```text
MD_Files/
├── 01_PROJECT_OVERVIEW.md              # Project vision, problem statement & objectives
├── 02_TECH_STACK.md                    # Detailed tech stack specifications & zero-dep guarantee
├── 03_REQUIREMENTS.md                  # Functional and non-functional requirements matrix
├── 04_FEATURES.md                      # Implemented (Phase 1/2) and planned (Phase 3) features
├── 05_SYSTEM_ARCHITECTURE.md           # High-level system architecture & Mermaid diagrams
├── 06_EXTENSION_ARCHITECTURE.md        # Chrome MV3 service worker & loader architecture
├── 07_FOLDER_STRUCTURE.md              # Complete workspace folder & file map
├── 08_FILE_RESPONSIBILITIES.md          # Exhaustive file breakdown & symbol index
├── 09_DATA_FLOW.md                     # Step-by-step sequence diagrams & data pipelines
├── 10_DOM_INSPECTION.md                # Capture phase click intercept & elementFromPoint math
├── 11_ELEMENT_INFORMATION_SCHEMA.md   # Complete JSON schema specification & payload example
├── 12_CHROME_APIS.md                   # Chrome Extension APIs & permissions justification
├── 13_UI_UX.md                         # Design system tokens, color palette & UI interactions
├── 14_SECURITY.md                      # Security model, Shadow DOM sandbox & text escaping
├── 15_TESTING.md                       # Manual verification matrix & edge-case test suite
├── 16_SETUP.md                         # Step-by-step browser unpacked installation guide
├── 17_DEVELOPMENT_WORKFLOW.md          # Developer lifecycle, reload process & console logging
├── 18_CODING_STANDARDS.md              # ES2023 style rules, JSDoc & naming conventions
├── 19_ERROR_HANDLING.md                # Fallback strategies (script injection, clipboard copy)
├── 20_CURRENT_IMPLEMENTATION.md        # Current snapshot of Phase 1 & 2 completion
├── 21_ROADMAP.md                       # Multi-phase development roadmap (Phase 1 to 4)
├── 22_FUTURE_AI_INTEGRATION.md         # Phase 3 LLM prompt engineering & AI pipeline design
├── 23_KNOWN_LIMITATIONS.md             # Technical boundaries (cross-origin iframes, chrome://)
└── 24_CHANGELOG.md                     # Project release history & version log
```

---

## 📥 Installation & Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ChiragVasava/DOMLens.git
   ```

2. **Open Chrome Extensions Page**:
   In Google Chrome, navigate to `chrome://extensions/`.

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner.

4. **Load Unpacked Extension**:
   - Click **Load unpacked** in the top toolbar.
   - Select the cloned project root folder (`DOMLens`).

5. **Inspect Elements**:
   - Open any web page.
   - Press `Ctrl + Shift + I` (Mac: `Cmd + Shift + I`) or click **Enable Inspector** in the extension popup!

---

## 📄 License & Team

Developed by **Chirag Vasava** and team at **Maharaja Sayajirao University of Baroda (Department of Computer Science & Engineering)** under the guidance of **Jhal Shah**.

Licensed under the MIT License.
