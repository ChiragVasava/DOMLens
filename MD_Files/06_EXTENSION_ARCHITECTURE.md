# 06 - Chrome Extension Architecture (Manifest V3)

## Manifest V3 Architecture Blueprint

Manifest V3 enforces non-persistent background service workers, sandbox constraints, dynamic module specifications, and explicit permission scopes.

---

## 1. Background Service Worker Architecture
Unlike MV2 background pages that ran continuously in memory, MV3 uses event-driven service workers that start when events trigger and shut down when idle.

### Service Worker Responsibilities (`background/background.js`)
- **Lifecycle Events**: Listens to `chrome.runtime.onInstalled` to initialize default storage (`inspectModeActive: false`).
- **Command Handling**: Listens to `chrome.commands.onCommand` for `toggle-inspect-mode` (`Ctrl+Shift+I`).
- **State Synchronization**: Persists active tab inspection state in `chrome.storage.local`.
- **Dynamic Content Injection**: If direct message passing to a tab fails (e.g. extension newly loaded or tab refreshed), the service worker invokes `chrome.scripting.executeScript` to inject `content/loader.js` on demand.

```javascript
// Dynamic Injection Fallback in background.js
chrome.tabs.sendMessage(tabId, { action: ACTIONS.INSPECT_STATE_CHANGED, active: newState })
  .catch(async (err) => {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/loader.js']
    });
  });
```

---

## 2. Dynamic ES Module Content Script Loader

Manifest V3 `content_scripts` in `manifest.json` do not support native `import`/`export` syntax directly in declared script arrays.

### Solution Pattern (`content/loader.js`)
1. In `manifest.json`, declare `content/loader.js` as standard content script.
2. In `web_accessible_resources`, expose `utils/*.js` and `content/*.js`.
3. Inside `content/loader.js`, dynamically load `content/inspector.js` using browser native dynamic `import()` via `chrome.runtime.getURL()`.

```javascript
// content/loader.js
(async () => {
  try {
    const src = chrome.runtime.getURL('content/inspector.js');
    await import(src);
  } catch (err) {
    console.error('[DOMLens] Failed to load content script module:', err);
  }
})();
```

---

## 3. Shadow DOM Encapsulation Boundary

To prevent CSS collisions between the target web page and the inspector UI, all UI elements are rendered inside a closed/open Shadow Root attached to `<website-inspector-root>`.

```text
[Web Page Document DOM]
  └── <website-inspector-root> (pointer-events: none, z-index: 2147483647)
        └── #shadow-root (open)
              ├── <style> (Scoped Inspector Overlay & Panel Styles)
              ├── <div class="inspector-box hover-box">
              ├── <div class="inspector-box selected-box">
              ├── <div class="inspector-tooltip">
              └── <div class="inspector-panel"> (pointer-events: auto !important)
```

### Pointer Events Boundary Handling
- The host tag `<website-inspector-root>` has `pointer-events: none` so hover highlights do not block user cursor interactions with underlying webpage elements.
- The inspector panel `.inspector-panel` explicitly sets `pointer-events: auto !important` so buttons, tabs, and scrollbars inside the panel remain fully interactive.
