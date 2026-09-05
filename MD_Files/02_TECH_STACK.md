# 02 - Technology Stack

## Core Technology Specifications

| Layer | Technology | Specification / Standard | Rationale |
| :--- | :--- | :--- | :--- |
| **Platform** | Chrome Extension Manifest V3 | Chrome MV3 Standard (`manifest_version: 3`) | Modern Chrome extension security, service worker model, and lifecycle management. |
| **Logic Layer** | Vanilla ES2023 JavaScript | Standard ES Modules (`import`/`export`) | Native browser module loading, zero bundler setup, maximum execution speed. |
| **Presentation** | HTML5 & Vanilla CSS3 | Custom CSS Variables, Glassmorphism dark theme | Lightweight styling, full layout control, sleek dark visual UI. |
| **DOM Isolation** | Shadow DOM API | Attach Shadow Root (`mode: 'open'`) | Complete 2-way CSS isolation between host webpage and extension UI. |
| **Build & Tooling** | Zero External Bundlers | Raw JavaScript / Native DOM APIs | No Node.js runtime, Webpack, Vite, React, or Tailwind dependencies required. |

---

## Chrome Extension Specifications

### 1. Extension Manifest (`manifest.json`)
- **Manifest Version**: 3
- **Extension Name**: `Qursor++`
- **Version**: `1.0.0`
- **Background Worker**: `background/background.js` (type: `"module"`)
- **Content Scripts**: Entry loader script `content/loader.js` running at `document_idle` on `<all_urls>`
- **Keyboard Shortcut Command**: `Ctrl+Shift+I` (Mac: `Cmd+Shift+I`) to toggle inspect mode

### 2. Runtime API Dependencies
- `chrome.runtime`: Extension lifecycle events, runtime message dispatch (`onMessage`, `sendMessage`), resource URL resolution (`getURL`).
- `chrome.storage.local`: Local persistent key-value storage for inspect state management (`inspectModeActive`).
- `chrome.tabs`: Active tab query (`chrome.tabs.query`), active tab message passing (`chrome.tabs.sendMessage`), and documentation tab creation (`chrome.tabs.create`).
- `chrome.commands`: Global keyboard shortcut listener (`chrome.commands.onCommand`).
- `chrome.scripting`: Dynamic script execution (`chrome.scripting.executeScript`) as fallback injection mechanism.

---

## Zero-Dependency Guarantee

Qursor++ is built entirely with native web standard technologies.

```text
Dependencies Count: 0
External Libraries: None (No React, Vue, jQuery, Lodash, or Tailwind)
Node.js Runtime Needed for Execution: No
Package Manager Requirement for Installation: None
```

### Advantages of Zero External Dependencies
1. **Lightweight Installation**: Total extension disk footprint is under ~250 KB.
2. **Instant Execution**: Zero bundler overhead or library initialization lag.
3. **Enhanced Security**: No third-party package vulnerabilities (CVEs) or supply-chain attack vectors.
4. **Chrome Web Store Compliance**: Fast review verification and full compliance with Manifest V3 strict CSP.
