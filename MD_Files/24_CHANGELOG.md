# Qursor++ — Release Changelog

All notable changes to **Qursor++** are documented in this file.

---

## [1.0.0] - Master Redesign & Feature Implementation

### 🎨 Complete UI/UX Redesign & Theme System
- **Design Tokens Engine**: Implemented `utils/theme.js` for centralized CSS custom properties (`--q-bg-primary`, `--q-surface`, `--q-accent`, `--q-border`, `--q-text-primary`).
- **Dark, Light, & System Modes**: Complete theme support across Extension Popup and Shadow DOM floating inspector panel with live theme switcher (`☀️ / 🌙`).
- **Chrome Storage Persistence**: Automatically syncs user theme preference across sessions using `chrome.storage.sync`.
- **Developer-Tool Aesthetics**: Compact visual identity inspired by modern devtools (Linear, Raycast, Vercel design systems), featuring precise typography, glassmorphism, responsive tab bar, dark/light theme switching, code syntax highlighting, and interactive toast feedback (`utils/toast.js`).

### 📊 12 Developer-Focused Inspection Tabs
- Extended inspection panel tabs to **12 structured developer sections**:
  1. `Overview`: Tag, ID, classes, ARIA role, accessible name, text content, input value, tab index, visibility state.
  2. `Styles`: Formatted computed CSS rules list.
  3. `Layout`: Box model metrics (dimensions, display, position, top/left/right/bottom, z-index, overflow).
  4. `Typography`: Font family, font size, font weight, line height, letter spacing, text alignment, text transform.
  5. `Colors`: Text color, background color, border color, box shadow, opacity with live color swatches and 1-click format copy.
  6. `Spacing`: Margin, padding, gap with interactive box model visual diagram.
  7. `Border`: Top/Right/Bottom/Left border widths, styles, colors, and border-radius.
  8. `Flex & Grid`: Flex direction, wrap, justify-content, align-items, flex-grow/shrink, grid columns/rows, gap.
  9. `DOM`: Parent node, children count/types, siblings, DOM tree depth level, selector path tree.
  10. `Accessibility (A11y)`: ARIA attributes (`aria-*`), implicit/explicit roles, accessible names, keyboard navigation states.
  11. `Component`: Multi-framework code synthesizer with interactive code editor.
  12. `AI Prompt`: Structured prompt generator for AI coding assistants.

### ⚛️ Multi-Framework Component Generator
- Implemented `utils/component_generator.js` and `utils/tailwind_mapper.js` supporting:
  - **React JSX**: Clean functional component export (`export default function Component()`).
  - **Vue 3 SFC**: Single File Components with `<template>`, `<script setup>`, `<style scoped>`.
  - **Angular Component**: Angular 17+ standalone `@Component` metadata and template.
  - **Tailwind CSS HTML**: Utility class mapper converting computed styles into Tailwind utility classes.
  - **Vanilla HTML/CSS/JS**: Modular HTML, CSS, and JS bundle.
  - **Clean HTML & CSS**: Formatted HTML snippet and computed CSS block.

### ✨ Structured AI Prompt Generator
- Implemented `utils/prompt_generator.js` aggregating element telemetry (target specs, DOM hierarchy, visual styling, layout, assets, responsive behavior, interaction states, and AI requirements) into structured markdown prompts for LLM coding agents (Cursor, Claude, Antigravity, ChatGPT).
- Added editable prompt preview textarea, target framework selector, copy prompt button, download `.md` file button, and prompt regenerator.

### ⚡ Quick Action Toolbar & Toast Feedback
- Non-intrusive action confirmation toasts (`utils/toast.js`) inside Shadow DOM.
- 1-click file download of generated component code (`.jsx`, `.vue`, `.html`) and AI prompts (`.md`).
