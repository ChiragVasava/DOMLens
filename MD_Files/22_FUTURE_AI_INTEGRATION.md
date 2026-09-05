# 22 - Future AI Assistant Integration Architecture

## Phase 3 AI Integration Design

**Qursor++** is architected to seamlessly connect extracted DOM telemetry with Large Language Models (LLMs) like OpenAI GPT-4o, Google Gemini 1.5, or Anthropic Claude 3.5.

---

## Proposed AI Pipeline Architecture

```mermaid
graph LR
    SelectedElement[Selected DOM Element] --> Extractor[extractor.js Engine]
    Extractor --> JSONPayload[Structured Telemetry Payload]
    
    subgraph Phase 3 AI Module
        JSONPayload --> PromptEngine[Prompt Construction Engine]
        UserPrompt[User Natural Language Prompt<br/>'Make this button glassmorphic'] --> PromptEngine
        PromptEngine --> APIHandler[API Dispatcher<br/>OpenAI / Gemini / Custom Endpoint]
        APIHandler --> LLM[Large Language Model]
        LLM --> ReturnedCSS[Generated CSS Mutations]
        ReturnedCSS --> VisualDiff[Live Code Diff Viewer]
        VisualDiff -->|User Approves| StyleMutator[In-Page Style Mutator<br/>element.style[prop] = val]
    end

    StyleMutator --> RenderedPage[Updated Live Webpage UI]
```

---

## Proposed LLM Prompt Structure

When a user requests an AI-assisted style change, Qursor++ will construct a structured prompt incorporating element telemetry:

```text
[SYSTEM CONTEXT]
You are Qursor++ AI, an expert frontend developer and CSS wizard.
Mutate the CSS properties of the target HTML element according to the user's natural language request.

[TARGET ELEMENT TELEMETRY]
Tag: <BUTTON>
Selector: main#app > div.container > button.btn-primary
Current HTML: <button class="btn btn-primary">Submit Form</button>

Current Computed Styles:
- display: flex
- width: 140px
- height: 40px
- font-family: Inter, sans-serif
- font-size: 14px
- color: rgb(255, 255, 255)
- background-color: rgb(59, 130, 246)
- border-radius: 8px

[USER INSTRUCTION]
"Make this button look like a modern glassmorphic dark-theme pill with a subtle glowing border on hover."

[OUTPUT FORMAT REQUIREMENT]
Return ONLY a valid JSON object containing:
1. "cssRules": key-value map of updated CSS properties.
2. "explanation": 1-sentence description of changes.
```

---

## Planned Interface Modules (`content/ai.js`)

1. **AI Prompt Workspace Tab**: Dedicated 12th panel tab containing prompt input text area, LLM model selector (GPT-4o, Gemini 1.5 Pro, Local Ollama), and API key settings.
2. **Live Visual Code Diff View**: Modal view displaying side-by-side diffs (Red = Original Property, Green = Proposed AI Change) with `Apply Changes` and `Discard` controls.
3. **In-Page Style Mutator**: Applies approved style object directly to target DOM element `element.style` or injects scoped `<style>` rules.
