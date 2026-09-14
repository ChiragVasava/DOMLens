# 07 - Folder Structure

```text
DOMLens/
├── manifest.json                  # Manifest V3 extension configuration
├── README.md                      # Project root documentation & user guide
├── LICENSE                        # Open source license file
├── .gitignore                     # Git tracking exclusions
│
├── assets/                        # Graphic assets & branding
│   ├── logo.svg                   # Extension vector logo
│   └── icons/                     # Extension toolbar & browser icons
│       ├── icon16.png             # 16x16 icon
│       ├── icon48.png             # 48x48 icon
│       └── icon128.png            # 128x128 icon
│
├── background/                    # Extension background worker layer
│   └── background.js              # MV3 background service worker module
│
├── content/                       # Content scripts executed in web page context
│   ├── loader.js                  # Entry content script loading ES modules
│   ├── inspector.js               # Inspector state machine & event orchestrator
│   ├── overlay.js                 # Shadow DOM bounding box & hover overlay manager
│   ├── panel.js                   # Movable 9-tab Shadow DOM floating UI panel
│   └── extractor.js               # Analytical DOM & computed styles extraction engine
│
├── popup/                         # Extension Popup toolbar UI
│   ├── popup.html                 # Main popup interface HTML structure
│   ├── popup.css                  # Popup dark mode glassmorphic CSS stylesheet
│   └── popup.js                   # Popup state controller script
│
├── utils/                         # Modular shared helper utilities
│   ├── component_state.js         # Single authoritative component state model & pub/sub
│   ├── preview_renderer.js        # Isolated iframe srcdoc renderer with theme canvas isolation
│   ├── llm_service.js             # Multi-provider LLM service (Gemini, OpenAI, OpenRouter, Groq)
│   ├── component_generator.js     # React (Tailwind JSX) and HTML+CSS code synthesizer
│   ├── tailwind_mapper.js         # CSS to Tailwind utility & arbitrary value mapper
│   ├── asset_extractor.js         # Media scanner (thumbnails, images, SVGs, video, backgrounds)
│   ├── theme.js                   # Theme management (dark/light/system) engine
│   ├── toast.js                   # Non-blocking glassmorphic UI toast notifications
│   ├── constants.js               # Global action keys, 9 nav tabs, & theme constants
│   ├── dom.js                     # DOM tree hierarchy, node depth & attribute helpers
│   ├── selector.js                # Unique CSS selector generator (XPath completely purged)
│   ├── style.js                   # Computed style parser & RGB-to-Hex converter
│   └── clipboard.js               # Async clipboard copier with fallback
│
├── scripts/                       # Local build & development utility scripts
│   └── generate_icons.js          # Canvas icon generation script
│
└── MD_Files/                      # Detailed system & architecture documentation suite
    ├── 01_PROJECT_OVERVIEW.md
    ├── 02_TECH_STACK.md
    ├── 03_REQUIREMENTS.md
    ├── 04_FEATURES.md
    ├── 05_SYSTEM_ARCHITECTURE.md
    ├── 06_EXTENSION_ARCHITECTURE.md
    ├── 07_FOLDER_STRUCTURE.md
    ├── 08_FILE_RESPONSIBILITIES.md
    ├── 09_DATA_FLOW.md
    ├── 10_DOM_INSPECTION.md
    ├── 11_ELEMENT_INFORMATION_SCHEMA.md
    ├── 12_CHROME_APIS.md
    ├── 13_UI_UX.md
    ├── 14_SECURITY.md
    ├── 15_TESTING.md
    ├── 16_SETUP.md
    ├── 17_DEVELOPMENT_WORKFLOW.md
    ├── 18_CODING_STANDARDS.md
    ├── 19_ERROR_HANDLING.md
    ├── 20_CURRENT_IMPLEMENTATION.md
    ├── 21_ROADMAP.md
    ├── 22_FUTURE_AI_INTEGRATION.md
    ├── 23_KNOWN_LIMITATIONS.md
    └── 24_CHANGELOG.md
```
