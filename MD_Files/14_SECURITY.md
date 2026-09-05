# 14 - Security Architecture & Considerations

## Security Model Overview

**Qursor++** is designed under a Zero-Trust client security model, strictly following Chrome Extension Manifest V3 Security Policies (CSP), zero external network calls, zero dynamic code evaluation, and complete DOM encapsulation.

---

## Security Guarantees & Safeguards

### 1. Zero External Code Evaluation (`eval`)
- No use of `eval()`, `new Function()`, or dynamic string execution.
- All code is compiled statically within the extension package.
- Full compliance with Manifest V3 Content Security Policy (`script-src 'self'`).

### 2. Shadow DOM Style & DOM Sandboxing
- Extension UI elements are rendered inside `<website-inspector-root>` using Shadow DOM.
- Host web page scripts cannot easily access or tamper with internal inspector panel state.
- Inspector styles are scoped entirely to the Shadow Root, preventing site visual corruption.

### 3. Sanitized HTML Injection (`escapeHtml`)
When displaying extracted element outer HTML in the code block tab view (`content/panel.js`), all HTML strings are sanitized before rendering to prevent Cross-Site Scripting (XSS) within the inspector panel context.

```javascript
escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

### 4. Capture-Phase Event Isolation
Hover listeners (`handleMouseMove`) check element targets before processing:
- Targets matching `#website-inspector-root` or inside the inspector root are ignored.
- Mouse movement and click interception do not alter host webpage DOM states or mutate global prototypes.

### 5. Local Data Storage Scope
- State persistence (`inspectModeActive`) is stored exclusively in `chrome.storage.local`.
- No user browsing data, element history, or webpage telemetry is ever transmitted over the network or saved to remote servers.
