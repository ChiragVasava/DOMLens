# Qursor++ — Master Feature Architecture & Documentation

Point. Inspect. Generate. Build.

Qursor++ is a production-grade Chrome Extension (Manifest V3) combining visual HTML element inspection, computed style analysis, multi-framework code synthesis, AI prompt generation, asset tree scanning, and interactive style editing.

---

## 🚀 7 Ordered Master Feature Suite

### 1. 👁️ Live Component Preview (with Zoom Controls)
- **Isolated Component Frame**: Renders the selected element inside a Shadow DOM iframe with webpage stylesheet extraction and HTML table/list structure wrapping (`<tr>`, `<td>`, `<th>`, `<li>`, `dt/dd`).
- **Interactive Zoom Controls**: Features `-` (Zoom Out), `Fit` (Auto Scale Fit), `100%` (Original Scale), `+` (Zoom In) supporting scales from **15%** to **300%** with a live scale percentage badge (e.g. `80%`).

### 2. ⓘ Detailed Overview & Telemetry (2nd Feature)
- **Tag & General Info**: Tag name, ID, class list, ARIA role, accessible name, text content, input value, tabIndex, visibility.
- **Typography & Color Specimen Card**: Live specimen preview (`AaBbCc...`) in inspected element's exact font family, size, and weight, plus font-family, size, weight, line-height, letter spacing, text color, background color, contrast badge (`• Good 6.33:1`).
- **Box Model Spacing Diagram**: Interactive visual diagram showing Margin, Padding, and Element dimensions.
- **DOM & Selectors**: CSS Selector path and XPath location with 1-click copy.

### 3. 📄 Code Generator & Export Filters (3rd Feature)
- **Separated Vanilla Formats**:
  - **HTML ONLY**: Pure clean HTML snippet without CSS/JS/Markdown.
  - **CSS ONLY**: Pure computed CSS declarations block.
  - **JAVASCRIPT ONLY**: Pure event listener / interactive logic JS snippet.
  - **HTML + CSS + JAVASCRIPT**: Complete standalone single bundle.
- **Framework Synthesizer**: React JSX (`export default function Component()`), Vue 3 SFC (`<template>`, `<script setup>`, `<style scoped>`), Angular Component, Tailwind CSS HTML.
- **Scope & Style Toggles**: `Selected` vs `Full Page` DOM extraction, `Computed` vs `Classes` style mode.

### 4. 💬 Edit & Annotate (4th Feature)
- **Natural Language CSS Instruction Parser**: Text instruction input supporting instructions such as `"Make background blue"`, `"Set font size to 24px"`, `"Set padding 16px"`, `"Set border radius 12px"`.
- **Direct Style Inputs**: Editable input fields for `color`, `background-color`, `font-size`, `font-weight`, `border-radius`.
- **Live Preview Mutation**: Changes immediately mutate component styles in the live preview iframe and update generated code.

### 5. 🖼️ Asset & Media Scanner (5th Feature)
- **Full DOM Subtree Scanner**: Scans selected element and all descendants for media assets.
- **YouTube Thumbnail & Media Intelligence**: Detects `<img src>`, `srcset`, `data-src`, `data-thumb`, and CSS `background-image: url(...)`.
- **Filter Pills**: `All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`.
- **Asset Cards**: Thumbnail preview, file format metadata, copy URL/markup button, and 1-click download button.

### 6. 👤 Structured AI Prompt Builder (6th Feature)
- **LLM-Ready Prompts**: Synthesizes detailed markdown prompts formatted for AI coding agents (Cursor, Claude, Antigravity, ChatGPT).
- Includes TARGET, DOM HIERARCHY, VISUAL APPEARANCE, LAYOUT, ASSETS, RESPONSIVE BEHAVIOR, INTERACTION STATES, and AI REQUIREMENTS.
- Target framework dropdown selector (`React`, `Next.js`, `Vue 3`, `Angular`, `Tailwind`), editable prompt textarea, copy prompt button, download `.md` file button.

### 7. ⚙️ Extension Settings & Theme Engine (7th Feature)
- **Synchronized Theme System**: Dark, Light, and System modes with Chrome Storage persistence (`chrome.storage.sync`). Updates Popup and Shadow DOM floating panel instantly.
- **Keyboard Shortcuts**: `Ctrl + Shift + I` toggle, `ESC` exit inspect mode.
