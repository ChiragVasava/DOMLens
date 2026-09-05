# 19 - Error Handling & Resilience Architecture

## Error Resilience Matrix

**Qursor++** implements defensive error handling across content script injection, chrome API messaging, clipboard writing, and DOM parsing.

---

## Key Error Scenarios & Fallback Strategies

```text
┌──────────────────────────────────────┬──────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
│ Failure Scenario                     │ Root Cause                               │ Fallback / Mitigation Strategy                             │
├──────────────────────────────────────┼──────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ Direct Tab Message Failure           │ Content script not yet injected into tab │ Catch error in background.js; dynamically inject loader.js │
│ Navigator Clipboard Write Denied     │ Browser CSP or focus loss                │ Fallback to document.execCommand('copy') textarea element │
│ Non-Element Hover Target             │ Cursor over SVG textNode or window root  │ Safe type guard check (element instanceof Element)         │
│ Missing / Empty Style Properties     │ Browser computed value returns initial   │ Standardized string fallback ('N/A', 'None', 'normal')     │
│ Restricted Chrome Internal Web Page  │ chrome:// or Web Store origin URL        │ Caught by host_permissions sandbox rules gracefully        │
└──────────────────────────────────────┴──────────────────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## Detailed Fallback Code Snippets

### 1. Service Worker Dynamic Injection Fallback (`background/background.js`)

If a tab message fails because content scripts are not yet initialized:

```javascript
chrome.tabs.sendMessage(tabId, { action: ACTIONS.INSPECT_STATE_CHANGED, active: newState })
  .catch(async (err) => {
    console.warn('[DOMLens] Direct message failed, injecting content loader script...', err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/loader.js']
      });
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: ACTIONS.INSPECT_STATE_CHANGED, active: newState });
      }, 150);
    } catch (injectErr) {
      console.error('[DOMLens] Injection failed:', injectErr);
    }
  });
```

---

### 2. Dual-Layer Async Clipboard Writer (`utils/clipboard.js`)

Attempts modern `navigator.clipboard.writeText()` first. If blocked by browser permissions, seamlessly falls back to temporary off-screen `<textarea>` selection and `document.execCommand('copy')`:

```javascript
export async function copyToClipboard(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[DOMLens] navigator.clipboard failed, attempting execCommand fallback', err);
  }

  // Off-screen textarea fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('[DOMLens] Fallback copy failed:', err);
    return false;
  }
}
```
