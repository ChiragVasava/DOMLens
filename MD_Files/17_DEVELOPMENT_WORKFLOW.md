# 17 - Development & Debugging Workflow

## Developer Lifecycle & Debugging Guide

Developing Manifest V3 extension components requires understanding the execution contexts: Background Service Worker Context, Content Script Context, Extension Popup Context, and Shadow DOM UI Context.

---

## Chrome DevTools Inspection Scenarios

```text
┌───────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Component Context             │ How to Inspect / Debug in Chrome DevTools                   │
├───────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Extension Popup UI            │ Right-click popup window icon → Inspect                     │
│ Background Service Worker     │ chrome://extensions/ → Inspect views: service worker        │
│ Content Scripts (loader, etc) │ Open target page DevTools → Console → Top context dropdown  │
│ Shadow DOM Inspector Panel    │ Open target page DevTools → Inspect #website-inspector-root │
└───────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Rapid Reload Workflow

When making code changes to Qursor++:

### 1. Changes to Content Scripts (`content/*.js`) or Utils (`utils/*.js`)
- Save file in code editor.
- Refresh the active target webpage tab in browser (`Ctrl+R` / `Cmd+R`).
- Re-trigger inspector mode (`Ctrl+Shift+I`).

### 2. Changes to Background Worker (`background/background.js`) or Manifest (`manifest.json`)
- Save file in code editor.
- Navigate to `chrome://extensions/`.
- Click the **Reload (↻)** icon on the Qursor++ extension card.
- Refresh the active target webpage tab.

---

## Console Logging Guidelines

All extension log statements use prefixed logging tags for clear console filtering:

```javascript
console.log('[DOMLens] Engine initialized.');
console.warn('[DOMLens] Direct message failed, injecting content loader script...', err);
console.error('[DOMLens] Injection failed:', injectErr);
```

Filter console logs in Chrome DevTools by searching `[DOMLens]` in the Console Filter bar.
