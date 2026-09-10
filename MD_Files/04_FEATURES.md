# Qursor++ — Feature Documentation

Point. Inspect. Generate. Build.

Qursor++ is a professional, developer-grade Chrome Extension designed for visual HTML inspection, computed style analysis, multi-framework code synthesis, and AI prompt generation.

---

## Core Feature Suite

### 1. 🔍 Sub-Pixel Element Inspector & Visual Overlay
- **Capture-Phase Hover Tracking**: Hover over any DOM element on any website with zero layout shift or flickering.
- **Scroll-Locked Selection Box**: Fixed green selection box anchored to element absolute coordinates during scrolling and resizing.
- **Isolated Shadow DOM**: All extension overlays and panels render inside `<website-inspector-root>` Shadow DOM to prevent style leakage.
- **Live Tooltip**: Displays tag name, ID, CSS classes, and exact pixel dimensions (`WIDTH×HEIGHTpx`).

### 2. ☀️ Dark & Light Theme System
- **Design Tokens Engine**: Powered by `utils/theme.js` using CSS custom properties (`--q-bg-primary`, `--q-surface`, `--q-accent`, `--q-border`, etc.).
- **Theme Modes**: Supports **Dark**, **Light**, and **System** preference modes.
- **Chrome Storage Persistence**: Automatically syncs and persists user theme across extension popup and floating panel.

### 3. 📊 12 Developer-Focused Inspection Tabs
1. **Overview**: Tag, ID, classes, ARIA role, accessible name, text content, input value, tab index, visibility state.
2. **Styles**: Formatted computed CSS rules list.
3. **Layout**: Box model metrics (dimensions, display, position, top/left/right/bottom, z-index, overflow).
4. **Typography**: Font family, font size, font weight, line height, letter spacing, text alignment, text transform.
5. **Colors**: Text color, background color, border color, box shadow, opacity with live color swatches and 1-click format copy.
6. **Spacing**: Margin, padding, gap with interactive box model visual diagram.
7. **Border**: Top/Right/Bottom/Left border widths, styles, colors, and border-radius.
8. **Flex & Grid**: Flex direction, wrap, justify-content, align-items, flex-grow/shrink, grid columns/rows, gap.
9. **DOM**: Parent node, children count/types, siblings, DOM tree depth level, selector path tree.
10. **Accessibility (A11y)**: ARIA attributes (`aria-*`), implicit/explicit roles, accessible names, keyboard navigation states.
11. **Component**: Multi-framework code synthesizer with interactive code editor.
12. **AI Prompt**: Structured prompt generator for AI coding assistants.

### 4. ⚛️ Multi-Framework Component Generator
Converts extracted element telemetry into production-ready component snippets for:
- **React JSX**: Clean functional components (`export default function Component()`).
- **Vue 3 SFC**: Single File Components with `<template>`, `<script setup>`, and `<style scoped>`.
- **Angular Component**: Angular 17+ standalone `@Component` metadata and template.
- **Tailwind CSS HTML**: Utility class mapper (`utils/tailwind_mapper.js`) translating computed styles into Tailwind classes.
- **Vanilla HTML/CSS/JS**: Modular HTML, CSS, and JS bundle.
- **Clean HTML & CSS**: Formatted HTML snippet and computed CSS block.

### 5. ✨ Structured AI Prompt Generator
Synthesizes comprehensive prompts formatted specifically for AI coding agents (Cursor, Claude, Antigravity, ChatGPT). Includes:
- `TARGET`: Selected component tag, role, selector, XPath, dimensions.
- `DOM HIERARCHY & STRUCTURE`: Parent, depth level, child count, clean outer HTML.
- `VISUAL APPEARANCE & STYLING`: Colors, typography, box model spacing, borders, shadows, radii.
- `ASSETS & MEDIA`: Images, SVGs, icon details.
- `INTERACTION & STATES`: Hover, focus, active, disabled, link targets, form input types.
- `FRAMEWORK CONVENTIONS`: User-selected framework target (React / Next.js / Vue / Angular / Tailwind / Vanilla).
- `IMPLEMENTATION REQUIREMENTS`: Clear rules for AI agents to preserve visual hierarchy and fidelity.

### 6. ⚡ Quick Action Toolbar & Toast Feedback
- **Toolbar Buttons**: Copy Selector, Copy XPath, Copy HTML, Copy CSS, Copy Component, Generate AI Prompt.
- **Toast Notifications**: Non-intrusive action confirmation toasts (`utils/toast.js`) inside Shadow DOM.
- **File Download**: 1-click download of generated component code (`.jsx`, `.vue`, `.html`) and AI prompts (`.md`).
