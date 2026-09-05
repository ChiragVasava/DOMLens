# 15 - Testing Strategy & Verification

## Quality Assurance & Verification Methodology

Because **Qursor++** is a Chrome Extension operating inside third-party web page DOM contexts, testing focuses on DOM interception accuracy, Shadow DOM isolation, state synchronization, and performance under diverse web page structures.

---

## Testing Matrix

| Test Suite | Scope & Target | Verification Method | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **Activation & Shortcuts** | Extension Popup & `Ctrl+Shift+I` hotkey | Toggle state in popup and press hotkey in active tab. | Inspect mode activates/deactivates reliably; cursor changes to `crosshair`. |
| **Hover Bounding Box** | Element hover tracking (`overlay.js`) | Move cursor over buttons, text blocks, images, and flex layouts. | Blue hover bounding box and tag dimension tooltip track cursor in sub-pixel precision. |
| **Click Interception** | Capture-phase click intercept (`inspector.js`) | Click active links (`<a>`), form buttons (`<button type="submit">`), and inputs. | Element is selected; default link navigation and form submission are prevented. |
| **Shadow DOM Isolation** | Style containment (`panel.js`) | Inspect target elements on pages with heavy CSS frameworks (Tailwind, Bootstrap). | Inspector floating panel renders dark glassmorphic styling without style distortion. |
| **1-Click Export** | Clipboard operations (`clipboard.js`) | Click `📋 JSON`, `📋 HTML`, `📋 Selector`, `📋 XPath`, and `📋 Styles` buttons. | Correct formatted string is copied to system clipboard; toast notification appears. |
| **ESC Abort** | Keyboard shortcut listener (`inspector.js`) | Press `ESC` key while hovering over web page elements. | Inspect mode exits cleanly; hover highlights disappear; cursor resets to default. |
| **Dynamic SPAs** | React, Vue, Next.js dynamic client-side applications | Test element selection on dynamically re-rendered SPA elements. | Selectors and computed styles extract accurately despite dynamic DOM mutations. |

---

## Edge Case Test Scenarios

1. **Dark vs Light Webpage Surfaces**: Verified overlay visibility on both pitch-black (`#000000`) and pure white (`#ffffff`) website backgrounds.
2. **Fixed & Sticky Headers**: Verified bounding box alignment when inspecting elements inside `position: fixed` or `position: sticky` navigation bars during scroll.
3. **Deep Nested DOM Trees**: Verified DOM depth calculation and selector paths on elements nested >15 tree levels deep.
4. **Empty Attributes / Missing IDs**: Verified fallback output (`"N/A"`, `"None"`) when elements lack ID or class attributes.
