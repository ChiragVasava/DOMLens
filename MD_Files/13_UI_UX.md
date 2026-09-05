# 13 - UI / UX Design Specifications

## Design Philosophy

**Qursor++** adheres to modern developer interface guidelines: sleek dark mode glassmorphism, subtle micro-interactions, responsive tab navigation, and clear visual feedback.

---

## Visual Design Palette

```css
:root {
  /* Dark Glassmorphism Surfaces */
  --bg-dark: #0f172a;        /* Slate 900 - Deep Background */
  --surface-dark: #1e293b;   /* Slate 800 - Cards & Panel Headers */
  --surface-border: #334155; /* Slate 700 - Clean Borders */

  /* Vibrant Accent Tokens */
  --accent-cyan: #38bdf8;   /* Sky 400 - Primary Brand & Selection */
  --accent-blue: #3b82f6;   /* Blue 500 - Hover Bounding Boxes */
  --accent-green: #10b981;  /* Emerald 500 - Active Status & Selection */
  --accent-amber: #f59e0b;  /* Amber 500 - Element ID Tooltips */

  /* Typography Colors */
  --text-main: #f8fafc;     /* Slate 50 - Primary Readable Text */
  --text-muted: #94a3b8;    /* Slate 400 - Labels & Secondary Info */

  /* Shadows & Glassmorphism */
  --shadow-panel: 0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(56, 189, 248, 0.3);
  --backdrop-blur: blur(16px);
}
```

---

## Key UI Components & Interactions

### 1. Extension Popup UI (`popup/`)
- **Width**: `320px` compact popup container.
- **Brand Header**: Vector logo, gradient title ("Qursor++ AI"), and version badge.
- **Status Indicator Pill**: Animated pulsing emerald green indicator when inspect mode is active; neutral slate grey when inactive.
- **Action Button**: Gradient action button (`Enable Inspector` / `Disable Inspector`).
- **Shortcut Cards**: Visual `<kbd>` cheat-sheet (`Ctrl + Shift + I` & `ESC`).

### 2. Visual Overlay Highlights (`content/overlay.js`)
- **Hover Box**: 2px solid blue (`#3b82f6`) border with `rgba(59, 130, 246, 0.15)` fill.
- **Selected Box**: 2px solid green (`#10b981`) border with `rgba(16, 185, 129, 0.15)` fill.
- **Dimension Tooltip**: Floating dark pill positioned directly above target element showing `<tag#id.class width×height>`.

### 3. Encapsulated Floating Inspector Panel (`content/panel.js`)
- **Default Geometry**: `width: 480px`, `height: 560px`, `bottom: 20px`, `right: 20px`.
- **Resizable**: Native `resize: both` with minimum bounds (`min-width: 340px`, `min-height: 240px`).
- **Draggable Window**: Drag header (`#panelHeader`) to reposition anywhere within viewport boundaries.
- **Collapsible Mode**: Click `-` button to collapse panel into a compact 48px header bar.
- **11 Horizontal Tabs**: Scrollable tab navigation bar with visual active bottom border highlight.
- **Code Block Views**: Custom styled monospaced code blocks for HTML and CSS tab views.
- **Toast Notifications**: Animated top-center toast notification (`Copied JSON!`) confirming 1-click export actions.
