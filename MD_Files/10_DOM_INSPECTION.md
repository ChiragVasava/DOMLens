# 10 - DOM Inspection Methodology

## DOM Inspection Techniques & Algorithms

**Qursor++** uses capture-phase event listening, element targeting algorithms, sub-pixel bounding box math, and DOM isolation boundaries to achieve reliable element inspection across complex web applications.

---

## 1. Event Capture Phase Listener Architecture

In standard DOM event propagation, event listeners default to the **Bubbling Phase** (inner element to window root). If a website contains custom event listeners (such as `event.stopPropagation()`), bubbling listeners may never fire.

### Implementation Pattern (`content/inspector.js`)
Qursor++ attaches listeners during the **Capture Phase** by setting the third parameter of `addEventListener` to `true`.

```javascript
// Capture-phase event registration
document.addEventListener('mousemove', this.handleMouseMove, true);
document.addEventListener('click', this.handleClick, true);
document.addEventListener('keydown', this.handleKeyDown, true);
```

### Why Capture Phase is Essential
1. **Guaranteed Execution**: Intercepts events at the `document` root *before* any webpage scripts or framework handlers receive them.
2. **Page Action Interception**: `handleClick(e)` executes `e.preventDefault()` and `e.stopPropagation()` during capture phase, preventing link navigation (`<a href="...">`) or form triggers (`<button type="submit">`) while inspecting.

---

## 2. Element Resolution (`document.elementFromPoint`)

To determine which element lies under the user cursor:

```javascript
handleMouseMove(e) {
  if (!this.isActive) return;

  const target = document.elementFromPoint(e.clientX, e.clientY);
  
  // Ignore Qursor++'s own Shadow DOM host
  if (!target || target.closest('#website-inspector-root')) {
    this.overlay.hideHover();
    return;
  }

  if (target !== this.lastHoverElement) {
    this.lastHoverElement = target;
    this.overlay.updateHover(target);
  }
}
```

---

## 3. High-Performance Frame Rendering (`requestAnimationFrame`)

Hover bounding box rendering can cause layout thrashing if DOM measurements and mutations occur rapidly.

### Optimization Strategy (`content/overlay.js`)
Overlay updates are throttled using browser-native `requestAnimationFrame` scheduling.

```javascript
updateHover(element) {
  const rect = element.getBoundingClientRect();

  if (this.rafId) cancelAnimationFrame(this.rafId);

  this.rafId = requestAnimationFrame(() => {
    this.positionBox(this.hoverBox, rect);
    this.hoverBox.style.display = 'block';
    // Update tooltip positioning...
  });
}
```

---

## 4. Unique CSS Selector Generation Algorithm

`getCssSelector(element)` generates a unique, human-readable CSS selector path:

1. **Unique ID Check**: If element has an `id` that is unique in the document (`document.querySelectorAll('#id').length === 1`), return `#id` immediately.
2. **Class & Tag Path**: Traverses up parent hierarchy building `tag.class1.class2`.
3. **Internal Class Filtering**: Excludes inspector-injected class names (`!c.startsWith('website-inspector')`).
4. **Sibling Disambiguation (`:nth-child`)**: If sibling elements share the exact same tag and class names, appends `:nth-child(index)` to maintain uniqueness.
5. **Body Anchor**: Stops traversal at `<body>` or `<html>` to maintain short, clean selector strings.

---

## 5. Precise XPath Generation Algorithm

`getXPath(element)` generates standard XPath queries:
- If element has an ID, returns `//*[@id="elementId"]`.
- Otherwise, computes 1-indexed tag positional paths (e.g. `/html/body/main/div[2]/button[1]`).
