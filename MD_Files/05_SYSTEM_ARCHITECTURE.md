# 05 - System Architecture

## Overview
**Qursor++** follows a multi-tier Chrome Extension Manifest V3 architecture. The architecture separates the background service worker, extension popup UI, content script module orchestrator, and an isolated Shadow DOM presentation container backed by an authoritative `ComponentState` model and centralized `llm_service`.

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
        Storage[(chrome.storage.sync & local<br/>inspectModeActive, theme, apiKey)]
    end

    subgraph Host Web Page Context
        ContentLoader[Content Script Loader<br/>content/loader.js]
        Engine[Inspector Engine Orchestrator<br/>content/inspector.js]
        Extractor[Data Extractor Engine<br/>content/extractor.js]
        Utils[Utils Subsystem<br/>dom.js, style.js, selector.js, asset_extractor.js]
        HostDOM[Web Page Native DOM]
    end

    subgraph Encapsulated Shadow DOM Root
        ShadowRoot[<website-inspector-root><br/>Shadow DOM Boundary]
        Overlay[Visual Overlay Engine<br/>content/overlay.js]
        Panel[Floating Info Panel<br/>content/panel.js]
        CompState[Central ComponentState<br/>utils/component_state.js]
        LiveRenderer[Isolated Live Preview<br/>utils/preview_renderer.js]
        LLMService[Unified LLM Layer<br/>utils/llm_service.js]
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
    Panel -->|manages| CompState
    CompState -->|feeds HTML + CSS| LiveRenderer
    Panel -->|edit instructions| LLMService
    LLMService -->|updates current state| CompState

    Overlay -->|mounts inside| ShadowRoot
    Panel -->|mounts inside| ShadowRoot
```

---

## Architecture Component Layers

### 1. Control & Trigger Layer
- **Popup UI (`popup/`)**: User interface displaying inspect mode status pill, enable/disable toggle button, appearance switcher (Light, Dark, System), keyboard shortcuts, and feature badges.
- **Commands API (`chrome.commands`)**: Global shortcut listener (`Ctrl+Shift+I`) handled by background worker.

### 2. State & Messaging Layer (`background/background.js`)
- **Central Coordinator**: Maintains application active state (`inspectModeActive`) inside `chrome.storage.local`.
- **Tab Message Dispatcher**: Relays toggle messages and theme updates between Popup UI and active target tab.
- **Injection Safeguard**: Dynamically executes `content/loader.js` via `chrome.scripting.executeScript` if target tab has not loaded content scripts.

### 3. Execution & Analytical Layer (`content/`)
- **Loader (`content/loader.js`)**: Entry content script loaded into web pages; dynamically imports `content/inspector.js` as an ES Module.
- **Engine (`content/inspector.js`)**: Coordinates capture-phase mouse listeners, element hover detection via `document.elementFromPoint`, click interception, keyboard cancellation (`ESC`), and theme change propagation.
- **Extractor (`content/extractor.js`)**: Aggregates properties from helper utilities (`utils/dom.js`, `utils/style.js`, `utils/selector.js`) into a unified JSON telemetry payload.

### 4. Encapsulated Presentation & Component Layer (`Shadow DOM`)
- **Shadow Host (`<website-inspector-root>`)**: Custom element injected into webpage root containing an open Shadow DOM tree to isolate styles.
- **Authoritative Component State (`utils/component_state.js`)**: Single source of truth managing original telemetry, active HTML & CSS, active zoom, active format, and LLM editing state.
- **Live Preview Renderer (`utils/preview_renderer.js`)**: Rebuilds an isolated iframe srcdoc on HTML, CSS, theme, or zoom changes with canvas theme isolation (`#000000` / `#FFFFFF`).
- **LLM Communication Layer (`utils/llm_service.js`)**: Handles provider autodetection, timeout handling, masked storage, and structured JSON parsing for editing and React generation.
- **Floating Panel (`content/panel.js`)**: 9-tab resizable inspector window with drag-and-drop support, format switching, and clipboard export buttons.
