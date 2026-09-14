# Qursor++ ⚡

> **Point. Inspect. Edit with AI. Generate. Build.**
> 
> *A Production-Grade Visual HTML Inspector, Computed Style Analyzer, React (Tailwind JSX) & HTML+CSS Component Generator, Asset Tree Scanner, Natural Language LLM Component Editor & Multi-Provider AI Engine Chrome Extension.*

Qursor++ is a lightweight, high-precision Chrome Extension (Manifest V3) that allows developers, UI engineers, and AI workflows to visually inspect any HTML element on **ANY website**, extract complete computed styles, box model dimensions, typography, and color codes, synthesize production-ready React (Tailwind JSX) and HTML+CSS component code, scan full asset trees (including YouTube thumbnails), edit component markup and styles live using natural language AI instructions, and preview components inside a theme-isolated sandbox.

---

## 🚀 9 Ordered Navigation Tabs

- 👁️ **1. Live Preview**: Isolated iframe rendering with **Canvas Background Isolation** (`#000000` Dark vs `#FFFFFF` Light preserving component backgrounds) and zoom controls (`-`, `Fit`, `100%`, `+`).
- ⓘ **2. Overview**: Element tag, dimensions, unique CSS selector, DOM depth level, and quick action buttons.
- 🔤 **3. Typography**: Font family, font size, weight, line-height, letter-spacing, and text alignment.
- 🎨 **4. Colors**: Text color, background color, border color, and visual color swatch pills.
- 📐 **5. Layout**: Interactive visual box model diagram (margin, padding, content) and flex/grid telemetry.
- 📄 **6. Code**: Component synthesizer with strictly two options: **HTML+CSS** and **React** (Tailwind JSX with Web Component sanitization), plus 1-click AI generation.
- 💬 **7. Edit**: Natural language LLM component editor with instruction prompt textarea, Apply, and Reset rollback.
- 🖼️ **8. Assets**: Deep DOM subtree media scanner (YouTube thumbnails, `<img>`, `srcset`, inline SVGs, CSS backgrounds, `<video>`) with format filter pills (`All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`).
- ⚙️ **9. Settings**: Multi-provider AI configuration (Google Gemini, OpenAI, OpenRouter, Groq) with masked API key storage and theme switcher.

---

## 🛠️ Technology Stack

| Layer | Technology | Specification / Standard |
| :--- | :--- | :--- |
| **Extension Platform** | Chrome Extension Manifest V3 | Service Worker Architecture (`manifest_version: 3`) |
| **Logic & Subsystems** | Vanilla ES2023 JavaScript | Native ES Modules (`import`/`export`) |
| **UI & Styling** | HTML5 & CSS Custom Properties | Design Tokens System (`utils/theme.js`) |
| **DOM Isolation** | Shadow DOM API | Encapsulated root (`<website-inspector-root>`) |
| **Build System** | Zero External Bundlers | Raw JavaScript / Native DOM APIs |

> 🚫 **Zero External Dependencies**: No React, No Vue, No jQuery, No TailwindCSS, No Bootstrap, No Node.js runtime required for browser execution.

---

## 📚 Complete Project Documentation (`MD_Files/`)

Exhaustive 24-file technical documentation suite inside [`MD_Files/`](file:///c:/Users/Chirag%20Vasava/Downloads/Personal/Final%20Projects/DOMLens/MD_Files):

```text
MD_Files/
├── 01_PROJECT_OVERVIEW.md              # Project vision, problem statement & objectives
├── 02_TECH_STACK.md                    # Detailed tech stack specifications & zero-dep guarantee
├── 03_REQUIREMENTS.md                  # Functional and non-functional requirements matrix
├── 04_FEATURES.md                      # 7 ordered feature suite architecture
├── 05_SYSTEM_ARCHITECTURE.md           # System architecture & sequence diagrams
├── 06_EXTENSION_ARCHITECTURE.md        # Chrome MV3 service worker & loader architecture
├── 07_FOLDER_STRUCTURE.md              # Folder & file map
├── 08_FILE_RESPONSIBILITIES.md          # File breakdown & module index
├── 09_DATA_FLOW.md                     # Sequence diagrams & data pipelines
├── 10_DOM_INSPECTION.md                # Capture phase click intercept & elementFromPoint math
├── 11_ELEMENT_INFORMATION_SCHEMA.md   # JSON schema specification & payload example
├── 12_CHROME_APIS.md                   # Chrome Extension APIs & permissions justification
├── 13_UI_UX.md                         # Design system tokens, color palette & UI interactions
├── 14_SECURITY.md                      # Security model & Shadow DOM sandbox
├── 15_TESTING.md                       # Manual verification matrix & edge-case test suite
├── 16_SETUP.md                         # Unpacked extension installation guide
├── 17_DEVELOPMENT_WORKFLOW.md          # Developer lifecycle & console logging
├── 18_CODING_STANDARDS.md              # ES2023 style rules & JSDoc conventions
├── 19_ERROR_HANDLING.md                # Fallback strategies & clipboard copy
├── 20_CURRENT_IMPLEMENTATION.md        # Snapshot of Qursor++ implementation
├── 21_ROADMAP.md                       # Multi-phase development roadmap
├── 22_FUTURE_AI_INTEGRATION.md         # LLM prompt engineering & AI pipeline design
├── 23_KNOWN_LIMITATIONS.md             # Technical boundaries (cross-origin iframes, chrome://)
└── 24_CHANGELOG.md                     # Release history & version log
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
   - Select the project root folder.

5. **Inspect Elements & Generate Code**:
   - Open any web page.
   - Press `Ctrl + Shift + I` (Mac: `Cmd + Shift + I`) or click **Enable Inspector** in the extension popup!

---

## 📄 License & Team

Developed by **Chirag Vasava** and team at **Maharaja Sayajirao University of Baroda (Department of Computer Science & Engineering)** under the guidance of **Jhal Shah**.

Licensed under the MIT License.
