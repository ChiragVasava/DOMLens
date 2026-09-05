# 12 - Chrome Extension APIs & Permissions

## Declared Permissions & Host Patterns

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

---

## Permission Justifications

| Permission | Purpose & Function | Minimal Privilege Compliance |
| :--- | :--- | :--- |
| `activeTab` | Grants temporary access to the current active tab when user clicks extension popup or triggers shortcut. | Complies with Google Chrome Store security policy by restricting access until explicitly invoked. |
| `scripting` | Allows background worker to dynamically inject `content/loader.js` into web pages via `chrome.scripting.executeScript`. | Used solely as a retry/fallback mechanism if standard content script registration is delayed. |
| `storage` | Grants access to `chrome.storage.local` to store global extension active state (`inspectModeActive`). | Synchronizes toggle state across extension popup UI and active tab content scripts. |
| `<all_urls>` | Enables inspection capabilities on all web URLs (HTTP, HTTPS, local files). | Necessary so users can inspect elements on any website or local dev server (`localhost`). |

---

## Detailed Chrome API Calls Reference

### 1. `chrome.runtime` API
- `chrome.runtime.onInstalled.addListener(callback)`: Fires on extension install/update; initializes default local storage (`inspectModeActive: false`).
- `chrome.runtime.onMessage.addListener(callback)`: Receives runtime messages between extension contexts (Popup ↔ Service Worker ↔ Content Scripts).
- `chrome.runtime.sendMessage(message, callback)`: Sends runtime message payload.
- `chrome.runtime.getURL(path)`: Resolves relative path to absolute Chrome Extension URL (`chrome-extension://<id>/content/inspector.js`).

### 2. `chrome.storage.local` API
- `chrome.storage.local.get(keys, callback)`: Asynchronously reads extension state (`inspectModeActive`).
- `chrome.storage.local.set(items, callback)`: Asynchronously persists updated extension state.

### 3. `chrome.tabs` API
- `chrome.tabs.query({ active: true, currentWindow: true })`: Queries current active tab ID in active window.
- `chrome.tabs.sendMessage(tabId, message)`: Sends targeted message payload to specific tab context.
- `chrome.tabs.create({ url })`: Opens documentation URL in new browser tab when user clicks "Documentation" button in popup.

### 4. `chrome.commands` API
- `chrome.commands.onCommand.addListener(callback)`: Listens for user hotkey presses (`Ctrl+Shift+I` / `Cmd+Shift+I`) to toggle inspect mode.

### 5. `chrome.scripting` API
- `chrome.scripting.executeScript({ target: { tabId }, files: ['content/loader.js'] })`: Dynamically injects entry loader content script if initial tab message fails.
