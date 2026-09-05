# 18 - Coding Standards & Style Conventions

## Code Quality & Style Rules

To maintain high readability, maintainability, and zero-dependency compliance across the codebase, all source code follows consistent JavaScript, HTML, and CSS standards.

---

## 1. JavaScript Standards (ES2023)

### ES Module Syntax
- Use standard ES module syntax (`import` / `export`).
- Use explicit relative file extensions in imports (e.g. `import { ACTIONS } from '../utils/constants.js';`).

### Class & Naming Conventions
- **Classes**: `PascalCase` (e.g. `DOMLensEngine`, `InspectorOverlay`, `InspectorPanel`).
- **Functions & Methods**: `camelCase` (e.g. `extractElementData`, `getCssSelector`, `handleMouseMove`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `ACTIONS`, `OVERLAY_STYLES`, `PANEL_TABS`).
- **Variables**: `camelCase` (e.g. `lastHoverElement`, `dragOffsetX`).

### JSDoc Annotations
All exported functions, classes, and non-trivial helper methods must include JSDoc comments detailing parameters and return types:

```javascript
/**
 * Generates a unique CSS Selector path for a target element
 * @param {Element} element 
 * @returns {string}
 */
export function getCssSelector(element) { ... }
```

---

## 2. Defensive Programming & Null Safety

- Always check element types before accessing properties:
  ```javascript
  if (!(element instanceof Element)) return null;
  ```
- Use optional chaining or logical OR fallbacks for optional attributes:
  ```javascript
  const id = element.id ? `#${element.id}` : '';
  ```
- Safely escape HTML content before injecting into innerHTML:
  ```javascript
  this.escapeHtml(d.general.fullOuterHTML);
  ```

---

## 3. CSS Conventions inside Shadow DOM

- Use scoped class selectors inside Shadow Root CSS (`.inspector-panel`, `.tab-btn`, `.code-block`).
- Prefix global theme tokens using standard CSS custom properties (`--bg-dark`, `--accent-cyan`).
- Enforce explicit `pointer-events` rules:
  - Container host: `pointer-events: none;`
  - Interactive UI controls: `pointer-events: auto !important;`
