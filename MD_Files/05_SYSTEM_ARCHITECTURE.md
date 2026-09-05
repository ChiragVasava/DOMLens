# 05 - System Architecture

## Overview
**Qursor++** follows a multi-tier Chrome Extension Manifest V3 architecture. The architecture separates the background service worker, extension popup UI, content script module orchestrator, and an isolated Shadow DOM presentation container.

---

## High-Level System Architecture Diagram

```mermaid
graph TD
    User([User])
    
    subgraph Browser Context
        PopupUI[Extension Popup UI<br/>popup/popup.html + popup.js]
        ShortcutCmd[Keyboard Shortcut<br/>Ctrl+Shift+I]
    end

    subgraph Service Worker Context
        Background[Background Service Worker<br/>background/background.js]
        Storage[(chrome.storage.local<br/>inspectModeActive)]
    end

    subgraph Host Web Page Context
        ContentLoader[Content Script Loader<br/>content/loader.js]
        Engine[Inspector Engine Orchestrator<br/>content/inspector.js]
        Extractor[Data Extractor Engine<br/>content/extractor.js]
        Utils[Utils Subsystem<br/>dom.js, style.js, selector.js]
        HostDOM[Web Page Native DOM]
    end

    subgraph Encapsulated Shadow DOM Root
        ShadowRoot[<website-inspector-root><br/>Shadow DOM Boundary]
        Overlay[Visual Overlay Engine<br/>content/overlay.js]
        Panel[Floating Info Panel<br/>content/panel.js]
        Clipboard[Clipboard Utility<br/>utils/clipboard.js]
    end

    User -->|Clicks Icon| PopupUI
    User -->|Presses Key| ShortcutCmd
    
    PopupUI -->|chrome.runtime.sendMessage| Background
    ShortcutCmd -->|chrome.commands.onCommand| Background

    Background <-->|sync state| Storage
    Background -->|chrome.tabs.sendMessage| ContentLoader
    ContentLoader -->|dynamic import| Engine

    Engine -->|mouse / click events| HostDOM
    Engine -->|triggers extraction| Extractor
    Extractor -->|analyzes| Utils
    Utils -->|reads styles/tree| HostDOM

    Engine -->|renders highlight| Overlay
    Engine -->|updates data| Panel

    Overlay -->|mounts inside| ShadowRoot
    Panel -->|mounts inside| ShadowRoot
    Panel -->|copy click| Clipboard
```

---

## Architecture Component Layers

### 1. Control & Trigger Layer
- **Popup UI (`popup/`)**: User interface displaying inspect mode status pill, toggle button, keyboard shortcuts, and version info.
- **Commands API (`chrome.commands`)**: Global shortcut listener (`Ctrl+Shift+I`) handled by background worker.

### 2. State & Messaging Layer (`background/background.js`)
- **Central Coordinator**: Maintains application active state (`inspectModeActive`) inside `chrome.storage.local`.
- **Tab Message Dispatcher**: Relays toggle messages between Popup UI and active target tab.
- **Injection Safeguard**: Dynamically executes `content/loader.js` via `chrome.scripting.executeScript` if target tab has not loaded content scripts.

### 3. Execution & Analytical Layer (`content/`)
- **Loader (`content/loader.js`)**: Entry content script loaded into web pages; dynamically imports `content/inspector.js` as ES Module.
- **Engine (`content/inspector.js`)**: Coordinates capture-phase mouse listeners, element hover detection via `document.elementFromPoint`, click interception, and keyboard cancellation (`ESC`).
- **Extractor (`content/extractor.js`)**: Aggregates properties from helper utilities (`utils/dom.js`, `utils/style.js`, `utils/selector.js`) into a unified DevTools JSON payload.

### 4. Encapsulated Presentation Layer (`Shadow DOM`)
- **Shadow Host (`<website-inspector-root>`)**: Custom element injected into webpage root containing an open Shadow DOM tree.
- **Overlay Engine (`content/overlay.js`)**: Highlighting bounding boxes and dimension tooltips positioned via `requestAnimationFrame`.
- **Panel Engine (`content/panel.js`)**: 11-tab glassmorphic inspector window with drag-and-drop support, tab switching, custom scrollbars, and clipboard export buttons.
