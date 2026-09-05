# 23 - Known Limitations & Technical Boundaries

## Technical Boundaries & Browser Constraints

While **Qursor++** provides inspection capabilities across standard web applications, certain browser security boundaries impose technical limitations.

---

## 1. Cross-Origin `<iframe>` Elements
- **Limitation**: `document.elementFromPoint(x, y)` cannot inspect elements *inside* a cross-origin `<iframe>` due to browser Same-Origin Policy (SOP).
- **Behavior**: The overlay highlights the bounding box of the `<iframe>` container element itself rather than nested iframe child elements.
- **Workaround**: Users can open the iframe source URL directly in a browser tab to inspect internal child elements.

---

## 2. Closed Shadow DOM Roots
- **Limitation**: Standard DOM traversal APIs (`element.children`, `element.shadowRoot`) cannot inspect inside open or closed Shadow DOM trees created by third-party web components using `attachShadow({ mode: 'closed' })`.
- **Behavior**: Telemetry reflects the custom element host tag rather than closed internal shadow nodes.

---

## 3. Chrome System & Internal Origin URLs
- **Limitation**: Chrome Extension API policies block content script execution on Chrome internal URLs:
  - `chrome://*` (e.g. `chrome://settings`, `chrome://extensions`)
  - Chrome Web Store (`https://chromewebstore.google.com`)
- **Behavior**: The background service worker detects restricted URLs and suppresses inspector activation gracefully.

---

## 4. Hardware-Accelerated Canvas & WebGL Rendering
- **Limitation**: Elements rendered inside `<canvas>` or WebGL contexts (e.g. 3D games, Chart.js, HTML5 Canvas graphics) do not exist as standard HTML DOM nodes.
- **Behavior**: The overlay highlights the parent `<canvas>` tag bounding box.
