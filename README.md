# DOMLens 🔍

> **A Production-Grade Visual HTML Inspector, Computed Style Analyzer & DevTools Assistant Chrome Extension.**

DOMLens is a lightweight, high-precision Chrome Extension that allows developers, UI engineers, and AI programmers to visually inspect any HTML element on **ANY website**, extract complete computed styles, box model dimensions, typography, color codes, and DOM hierarchy metrics, and export DevTools-grade data in 1-click.

Designed specifically as an **AI-assisted development companion**, DOMLens enables instant copying of structured JSON payloads, CSS Selectors, XPaths, and HTML snippets ready to feed directly into AI coding assistants (such as ChatGPT, Claude, Gemini, or GitHub Copilot).

---

## 🚀 What DOMLens Does

- 🎯 **Visual Element Picking**: Moving the cursor highlights any HTML element with a hardware-accelerated blue outline and a real-time tooltip showing tag name, ID, class list, and pixel dimensions.
- ⚡ **Non-Intrusive & Isolated**: Inspects elements without modifying page layout, interfering with page scripts, or suffering from CSS style leakage.
- 📊 **DevTools-Grade Computed Analysis**: Extracts comprehensive element information organized into 11 interactive dashboard tabs:
  - **General**: Tag name, ID, classes, text content, value, role, ARIA attributes, disabled/required state, editability.
  - **Layout**: Width, height, top/left/bottom/right coordinates, display, position, overflow, visibility, opacity, z-index, box-sizing.
  - **Typography**: Font family, font size, font weight, line height, letter spacing, word spacing, text align, text transform, text decoration.
  - **Colors**: Text color, background color, border color, outline color, box shadow, opacity with automatic RGB-to-Hex conversion.
  - **Spacing**: Margin, padding, and row/column gaps.
  - **Border**: Border width, border radius, border style, border color.
  - **Flex & Grid**: Direction, justify content, align items, align content, flex wrap, grid template columns/rows, gap.
  - **DOM Hierarchy**: Parent tag/ID, child count, unique child tags, previous/next sibling tags, tree depth, CSS selector path, XPath.
  - **Attributes**: Complete non-empty HTML attribute key-value dictionary.
  - **HTML View**: Clean formatted innerHTML and outerHTML code block.
  - **CSS View**: Raw computed CSS style declarations block.
  - **Specialized Element Intelligence**: Natural vs displayed dimensions for images, target/rel for links, form/button types, input properties.
- 🎛️ **Interactive Dark-Theme Floating Panel**: A movable (drag header), resizable, collapsible, dark-mode panel rendered inside Shadow DOM.
- 📋 **1-Click Copy Toolbar**: Export JSON, HTML, OuterHTML, CSS Selector, XPath, and CSS Styles directly to system clipboard with animated toast notification.

---

## 🛠️ Tech Stack

DOMLens is built strictly using **pure native web technologies** following clean architectural principles:

| Technology | Purpose |
|---|---|
| **HTML5** | Markup structure for extension popup and floating inspection panel |
| **CSS3** | Glassmorphism dark-theme design system, custom scrollbars, micro-animations |
| **Vanilla JavaScript (ES2023)** | Core application logic, DOM parsing algorithms, style computing |
| **Chrome Extension Manifest V3** | Latest Chrome Extension API standards, Service Worker architecture |
| **Shadow DOM API** | Complete style isolation for visual overlays and floating panel |
| **Chrome Storage & Commands API** | Persistent settings and global keyboard shortcut handling (`Ctrl + Shift + I`) |

> 🚫 **Zero External Dependencies**: No React, No Vue, No jQuery, No TailwindCSS, No Bootstrap, No Node.js build step required. Loads directly unpacked.

---

## 🏛️ System Architecture

DOMLens uses a decoupled event-driven architecture with Shadow DOM encapsulation to guarantee zero style collision with target websites.

```
                               ┌──────────────────────────┐
                               │  Popup UI / Command Key  │
                               └────────────┬─────────────┘
                                            │ chrome.runtime.sendMessage
                                            ▼
                               ┌──────────────────────────┐
                               │ Background Service Worker│
                               └────────────┬─────────────┘
                                            │ chrome.tabs.sendMessage
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Target Webpage Context                                                                   │
│                                                                                         │
│   ├── Loader Script (loader.js) ──► Dynamically imports inspector module                │
│   │                                                                                     │
│   └── Orchestrator (inspector.js)                                                        │
│         ├── Event Handlers (mousemove, click [capture phase], keydown [ESC])             │
│         ├── Data Extractor (extractor.js) ──► Utilities (selector.js, dom.js, style.js)│
│         ├── Visual Overlay (overlay.js) ──► Shadow DOM Hover & Selection Rectangles      │
│         └── Floating Panel UI (panel.js) ──► Shadow DOM Movable & Resizable Panel       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Highlights
1. **Shadow DOM Encapsulation**: Both the hover highlight boxes and the floating inspection panel render inside a closed/open Shadow Root (`<website-inspector-root>`). This guarantees host site CSS resets or frameworks (like Tailwind or Bootstrap) never distort DOMLens UI, and DOMLens styles never pollute the host site.
2. **Capture Phase Click Interception**: Clicking elements during inspect mode intercepts default webpage click events (`e.preventDefault(); e.stopPropagation()`), preventing unintentional form submissions or link navigations.
3. **Pointer Events Scoping**: Overlays use `pointer-events: none` so element picking passes seamlessly to underlying DOM nodes, while the floating panel uses `pointer-events: auto !important` for full interactivity (scrolling, dragging, tab switching, button clicks).

---

## 💡 Key Benefits

1. **Perfect for AI Prompting**: Generates structured JSON payloads containing element attributes, hierarchy, typography, colors, and layout metrics, giving LLMs (ChatGPT, Claude, Copilot) exact context for UI generation or bug fixing.
2. **Zero Setup Cost**: No `npm install`, no build process, no node_modules. Load unpacked directly in Chrome and start inspecting immediately.
3. **Works Everywhere**: Operates cleanly on complex web applications (YouTube, GitHub, news portals, single page apps) regardless of frontend framework used.
4. **Lightweight & Fast**: Executes with minimal CPU and memory overhead.

---

## 📂 Folder Structure

```
DOMLens/
├── manifest.json            # Chrome Extension Manifest V3 configuration
├── background/
│   └── background.js        # Background Service Worker managing state & commands
├── popup/
│   ├── popup.html           # Modern dark-mode popup window HTML
│   ├── popup.css            # Popup styling & status pulse animation
│   └── popup.js             # Popup logic & chrome storage synchronization
├── content/
│   ├── loader.js            # Dynamic ES module loader for MV3 content scripts
│   ├── inspector.js         # Main content script orchestrator
│   ├── overlay.js           # Shadow DOM hover & selection highlight renderer
│   ├── panel.js             # Shadow DOM dark-theme floating panel component
│   └── extractor.js         # Master analytical engine compiling element payload
├── utils/
│   ├── constants.js         # Action keys, panel tabs, and overlay theme constants
│   ├── selector.js          # Unique CSS selector path & XPath builder
│   ├── dom.js               # DOM hierarchy analyzer & tree depth calculator
│   ├── style.js             # Computed style parser & RGB-to-Hex converter
│   └── clipboard.js         # Safe async clipboard copy helper
├── assets/
│   ├── logo.svg             # DOMLens vector logo
│   └── icons/               # Toolbar PNG icons (16px, 48px, 128px)
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── scripts/
│   └── generate_icons.js    # Node.js PNG icon generator script
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

---

## 📥 How to Install & Load in Chrome

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ChiragVasava/DOMLens.git
   ```

2. **Open Chrome Extensions**:
   In Google Chrome, navigate to:
   ```text
   chrome://extensions/
   ```

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner of the Extensions page.

4. **Load Unpacked Extension**:
   - Click the **Load unpacked** button in the top-left toolbar.
   - Select the cloned `DOMLens` folder containing `manifest.json`.

5. **Start Inspecting**:
   - Pin **DOMLens** to your Chrome toolbar.
   - Open any website (e.g. [https://wikipedia.org](https://wikipedia.org)).
   - Press `Ctrl + Shift + I` (or `Cmd + Shift + I` on Mac) or click **Enable Inspector** in the popup!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Shift + I` / `Cmd + Shift + I` | Toggle Inspect Mode on / off |
| `ESC` | Exit Inspect Mode immediately |

---

## 📊 Structured JSON Format Example

When clicking **Copy JSON** on any inspected element, DOMLens produces clean structured output:

```json
{
  "tag": "BUTTON",
  "selector": "body > header > div.nav-right > button#submit-btn",
  "xpath": "//*[@id=\"submit-btn\"]",
  "classes": ["btn", "btn-primary"],
  "general": {
    "tagName": "BUTTON",
    "id": "submit-btn",
    "disabled": false,
    "role": "button"
  },
  "dom": {
    "parentTag": "div",
    "childrenCount": 1,
    "depth": 4
  },
  "layout": {
    "width": "120px",
    "height": "40px",
    "display": "flex",
    "position": "relative"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "fontSize": "14px",
    "fontWeight": "600"
  },
  "colors": {
    "textColor": "rgb(255, 255, 255) (#ffffff)",
    "backgroundColor": "rgb(59, 130, 246) (#3b82f6)"
  }
}
```

---

## 🛣️ Future Roadmap

- [ ] **Phase 2 (AI Integration)**: Direct OpenAI / Anthropic API integration to generate React/Tailwind code snippets from selected DOM elements.
- [ ] **Phase 3 (Live Editing)**: Live visual style editor and element mutation observer.

---

## 👤 Author

**Chirag Vasava**
- GitHub: [@ChiragVasava](https://github.com/ChiragVasava)
- Repository: [DOMLens on GitHub](https://github.com/ChiragVasava/DOMLens.git)

---

## 📄 License

This project is licensed under the MIT License. Designed as a college Minor Project following production software engineering standards.
