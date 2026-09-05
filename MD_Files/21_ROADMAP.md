# 21 - Project Development Roadmap

## Multi-Phase Evolution Plan

```text
  Phase 1 (Completed)         Phase 2 (Completed)         Phase 3 (Planned)          Phase 4 (Future)
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│ • MV3 Extension Core │    │ • Shadow DOM Panel   │    │ • Live Style Edit    │    │ • Batch Pattern Match│
│ • Hover Highlight Box│ ──►│ • 11 Detailed Tabs   │ ──►│ • AI Prompt Workspace│ ──►│ • Design Token Export│
│ • Click Intercept    │    │ • DOM Depth Tree     │    │ • Natural Language   │    │ • VS Code Extension  │
│ • Popup Controller   │    │ • 1-Click Export     │    │ • Live Visual Diff   │    │ • TailWind Synthesis │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

---

## Roadmap Stage Details

### Phase 1: Foundation & Overlay Engine (`Completed`)
- Manifest V3 architecture setup.
- Event-driven Service Worker state sync.
- Real-time hover bounding overlay with sub-pixel floating tooltips.
- Capture-phase click interceptor (`e.preventDefault()`, `e.stopPropagation()`).
- Keyboard command shortcuts (`Ctrl+Shift+I` & `ESC`).

### Phase 2: Full Extraction & Encapsulated UI Panel (`Completed`)
- Full HTML extraction, sanitized attributes, tag-specific metadata (Images, Links, Forms).
- DOM tree hierarchy depth calculation (`utils/dom.js`).
- Movable, resizable, collapsible dark glassmorphic panel in Shadow DOM (`<website-inspector-root>`).
- 11 dedicated data tabs (*General, Layout, Typography, Colors, Spacing, Border, Flex & Grid, DOM, Attributes, HTML, CSS*).
- 1-Click JSON / HTML / OuterHTML / Selector / XPath / CSS clipboard export with animated toast feedback.

### Phase 3: AI Workspace & Live Editing (`Planned`)
- Inline style property editing inside floating panel for live visual in-page updates.
- Structured LLM prompt workspace converting extracted element JSON into LLM prompts for ChatGPT/Gemini/Claude.
- Natural language editing interface (e.g. *"Convert this button to a glassmorphism blue pill"*).
- Visual side-by-side CSS diff viewer showing original vs AI-generated CSS before applying.

### Phase 4: Enterprise & DevTools Integrations (`Future`)
- Automatic Tailwind CSS class synthesis matching computed inline styles.
- Batch component selector matching across entire document.
- Export to React / Vue / Web Component code generator templates.
