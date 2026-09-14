# Qursor++ — Master Feature Architecture & Documentation

Point. Inspect. Generate. Build.

Qursor++ is a production-grade Chrome Extension (Manifest V3) combining visual HTML element inspection, computed style analysis, React & Tailwind code synthesis, LLM-driven natural language component editing, media asset discovery, and theme-isolated live preview rendering.

---

## 🚀 9 Ordered Master Navigation Tabs

### 1. 👁️ Live (Live Component Preview & Canvas Isolation)
- **Authoritative Rendering**: Renders current HTML + current CSS inside an isolated iframe srcdoc without host page CSS leakage or extension variable interference.
- **Preview Canvas Theme Isolation**:
  - **Dark Mode**: Preview canvas background is `#000000`.
  - **Light Mode**: Preview canvas background is `#FFFFFF`.
  - Strictly preserves explicit component backgrounds (`<button style="background: red">` remains red in both themes).
- **Interactive Zoom Controls**: Features `-` (Zoom Out), `Fit` (Auto Scale Fit), `100%` (Original Scale), `+` (Zoom In) supporting scales from **10%** to **300%** with a live scale percentage badge.

### 2. ⓘ Overview (Detailed Metrics & Telemetry)
- **General Attributes**: Tag name, Element ID, CSS classes, ARIA role, Accessible name, text content preview.
- **Quick Styles & Colors**: Primary font stack, font size / weight, line height, text color swatch (with 1-click copy), background color swatch (with 1-click copy), bounding box dimensions.
- **Unique CSS Selector**: Precision selector path with 1-click clipboard copying.

### 3. T Typography (Specimen Render & Metrics)
- **Live Specimen Preview**: Renders live specimen text (`AaBbCc...`) rendered using the inspected element's exact font family, size, weight, line-height, and colors.
- **Font Stack Metrics**: Primary font family, full inherited font stack, font-size, font-weight, line-height, letter-spacing, text-align, text-transform.

### 4. 🎨 Colors (Swatches & Visual Telemetry)
- **Color Cards**: Text color, Background color, Border color with high-contrast color chips and 1-click HEX copy buttons.
- **Visual Effects**: Box shadow declarations, element opacity, and outline telemetry.

### 5. 📐 Layout (Box Model & Spacing)
- **Interactive Box Model Diagram**: Nested visual diagram rendering computed Margin, Padding, and content dimensions.
- **Detailed Metrics**: Top/Right/Bottom/Left margin and padding values, gap.
- **Layout Architecture**: Display mode, positioning mode, z-index, flex direction, align-items, justify-content, border radius.

### 6. 📄 Code (Code Generation & Export)
- **Dedicated Formats (Strictly 2 Options)**:
  - **HTML+CSS**: Clean, self-contained HTML markup with scoped `<style>` block.
  - **React**: Standalone React functional component (`export default function Component(...)`) styled with Tailwind CSS utility classes and arbitrary values (`w-[347px]`, `bg-[#123456]`).
- **AI-Powered Synthesis**: If an API key is configured, provides 1-click "⚡ Generate with AI" for deep component reconstruction with automatic web component sanitization.
- **Actions**: Independent 1-click Copy and Download (`.html` or `.jsx`) buttons.

### 7. 💬 Edit (Natural Language LLM Editing)
- **AI-Powered Modification**: Natural language instruction textarea (e.g. *"Make the background blue, increase padding to 20px, make the text bold"*).
- **Structured JSON Workflow**: LLM returns `{ html, css, changes }` validated before updating state.
- **Real-Time Synchronization**: Updating a component updates the authoritative state model, immediately re-rendering Live Preview and updating the Code tab.
- **Error Rollback**: If an LLM request fails, the previous working component state is strictly preserved.
- **Reset**: 1-click button restores the original captured component state.

### 8. 🖼️ Assets (Media Scanner & Format Filters)
- **Deep DOM Subtree Scanner**: Inspects `<img>`, `<picture>`, `<source>`, inline SVGs, CSS `background-image`, and HTML5 `<video>`.
- **YouTube Thumbnail Intelligence**: Reads `currentSrc`, `src`, `srcset`, `data-thumb`, and lazy-loaded attributes.
- **Format Filter Tabs**: `All`, `Images`, `SVG`, `PNG`, `JPG`, `WEBP`, `GIF`, `Other`.
- **Actions**: Asset thumbnail cards with dimensions, format metadata, Copy URL, and direct Download links.

### 9. ⚙️ Settings (AI Configuration & Theme Engine)
- **AI Configuration**:
  - API Key input with secure masked display (`••••••••••••1234`).
  - Provider Selector: Auto Detect, Google Gemini (Recommended), OpenAI, OpenRouter, Groq.
  - Custom Model selector.
  - Connection Status badge (`● Configured` / `○ Not Configured`).
  - Save and Clear buttons with confirmation.
- **Appearance**: Dark / Light / System theme modes with persistent storage in `chrome.storage.sync`.
- **Keyboard Shortcuts**: Documentation for `Ctrl + Shift + I` and `Escape`.
