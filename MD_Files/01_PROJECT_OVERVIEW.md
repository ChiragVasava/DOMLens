# 01 - Project Overview

## Project Vision & Purpose
**Qursor++** (formerly DOMLens) is an advanced, production-grade Chrome Extension (Manifest V3) designed to empower web developers, UI/UX designers, QA engineers, and AI workflows with visual HTML element inspection, computed CSS style extraction, DOM hierarchy depth mapping, and 1-click DevTools telemetry export.

When inspecting modern web applications, traditional browser DevTools require toggling between multiple panels, searching through complex style cascade inheritance rules, manually constructing CSS selectors or XPaths, and copying code snippets line-by-line. **Qursor++** solves these inefficiencies by placing an isolated, high-performance, non-intrusive floating inspection panel directly onto any webpage using Encapsulated Shadow DOM.

---

## Key Project Identity
- **Project Name**: Qursor++ (Internal code name: DOMLens)
- **Extension Type**: Chrome Extension Manifest V3
- **Primary Goal**: Rapid visual element inspection, DOM depth hierarchy analysis, and 1-click DevTools structured code export.
- **Current Version**: `v1.0.0` (Phase 1 & Phase 2 Completed)

---

## Problem Statement
Modern web development and AI-assisted design workflows present recurring pain points:
1. **Context Switching Overhead**: Developers spend significant time navigating between browser DevTools tabs (*Elements*, *Styles*, *Computed*, *Console*) to inspect simple element dimensions, colors, or typography.
2. **Manual Selector Construction**: Generating clean, unique CSS selectors or XPath expressions for automated testing or code modifications requires manual trial-and-error.
3. **Complex Style Cascades**: Computing exact rendered typography, flexbox/grid alignments, box model margins, and Hex colors from complex stylesheets requires manual aggregation.
4. **Style Leakage in Extensions**: Typical browser inspection extensions inject styles directly into the host web page DOM, causing styling conflicts or corrupting webpage layout.
5. **AI Prompt Structuring**: Preparing HTML/CSS telemetry for AI code generation models requires manual copying and clean formatting of target elements.

---

## Objectives
- **Zero Style Interference**: Encapsulate the extension overlay and floating inspector inside a closed Shadow DOM (`<website-inspector-root>`) so extension styles never leak into the host page and host page styles never corrupt the inspector.
- **Instant Visual Telemetry**: Display interactive hover bounding boxes and dimension tooltips with sub-pixel precision (`requestAnimationFrame`).
- **Comprehensive 11-Tab Analysis**: Group inspectable data into 11 logical tabs (*General, Layout, Typography, Colors, Spacing, Border, Flex & Grid, DOM, Attributes, HTML, CSS*).
- **1-Click DevTools Export**: Provide instant one-click copying for structured JSON payloads, clean HTML snippets, full outer HTML, unique CSS selectors, XPath queries, and raw computed CSS rule blocks.
- **Phase 3 Ready**: Build a modular analytical engine (`content/extractor.js`) designed for seamless integration with AI prompt generation engines and live in-page style editing.

---

## Target Audience
- **Frontend Engineers**: Instant verification of box model spacing, computed typography, and CSS flex/grid layout properties.
- **UI/UX Designers**: Extract precise color hex codes, line heights, font families, and element spacing.
- **QA & Automation Engineers**: Obtain unique CSS selectors and XPath strings for Selenium / Playwright test scripts.
- **AI Prompt Engineers & Developers**: Export clean, structured JSON telemetry of web UI components to feed into LLM prompt pipelines.
