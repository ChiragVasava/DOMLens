/**
 * Qursor++ AI - Centralized LLM Communication Layer
 * 
 * Provides unified, secure access to LLMs (Google Gemini, OpenAI, OpenRouter, Groq)
 * for Component Editing (structured HTML+CSS JSON output) and React + Tailwind generation.
 * Enforces API key safety, timeout control, robust response parsing, and error normalization.
 */

export const LLM_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  OPENROUTER: 'openrouter',
  GROQ: 'groq'
};

export const DEFAULT_MODELS = {
  [LLM_PROVIDERS.GEMINI]: 'gemini-1.5-flash',
  [LLM_PROVIDERS.OPENAI]: 'gpt-4o-mini',
  [LLM_PROVIDERS.OPENROUTER]: 'google/gemini-2.0-flash-001',
  [LLM_PROVIDERS.GROQ]: 'llama-3.3-70b-versatile'
};

const REQUEST_TIMEOUT_MS = 35000;

/**
 * Auto-detects provider based on the format of the API key
 * @param {string} key 
 * @returns {string} provider key
 */
export function detectProvider(key) {
  if (!key) return LLM_PROVIDERS.GEMINI;
  const k = key.trim();
  if (k.startsWith('AIza')) return LLM_PROVIDERS.GEMINI;
  if (k.startsWith('sk-or-')) return LLM_PROVIDERS.OPENROUTER;
  if (k.startsWith('gsk_')) return LLM_PROVIDERS.GROQ;
  if (k.startsWith('sk-')) return LLM_PROVIDERS.OPENAI;
  return LLM_PROVIDERS.GEMINI;
}

/**
 * Creates a masked representation of the API key for safe display (e.g. ••••••••••••1234)
 * @param {string} key 
 * @returns {string}
 */
export function maskApiKey(key) {
  if (!key) return '';
  const clean = key.trim();
  if (clean.length <= 6) return '••••••••';
  const lastFour = clean.slice(-4);
  return '••••••••••••' + lastFour;
}

/**
 * Retrieves the stored API key and LLM configuration from chrome.storage.sync
 * @returns {Promise<{ apiKey: string, provider: string, model: string, isConfigured: boolean }>}
 */
export async function getLlmConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['qursor_api_key', 'qursor_llm_provider', 'qursor_llm_model'], (res) => {
      const apiKey = (res.qursor_api_key || '').trim();
      const provider = res.qursor_llm_provider || detectProvider(apiKey);
      const model = res.qursor_llm_model || DEFAULT_MODELS[provider] || 'gemini-1.5-flash';
      resolve({
        apiKey,
        provider,
        model,
        isConfigured: !!apiKey
      });
    });
  });
}

/**
 * Persists the API key and LLM configuration to chrome.storage.sync
 * @param {string} apiKey 
 * @param {string|null} [provider=null] 
 * @param {string|null} [model=null] 
 * @returns {Promise<Object>}
 */
export async function saveLlmConfig(apiKey, provider = null, model = null) {
  const cleanKey = (apiKey || '').trim();
  const resolvedProvider = provider || detectProvider(cleanKey);
  const resolvedModel = model || DEFAULT_MODELS[resolvedProvider] || 'gemini-1.5-flash';

  return new Promise((resolve) => {
    chrome.storage.sync.set({
      qursor_api_key: cleanKey,
      qursor_llm_provider: resolvedProvider,
      qursor_llm_model: resolvedModel
    }, () => {
      resolve({
        apiKey: cleanKey,
        provider: resolvedProvider,
        model: resolvedModel,
        isConfigured: !!cleanKey
      });
    });
  });
}

/**
 * Clears stored API key and resets configuration
 * @returns {Promise<boolean>}
 */
export async function clearLlmConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(['qursor_api_key', 'qursor_llm_provider', 'qursor_llm_model'], () => {
      resolve(true);
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Core HTTP Fetch with Timeout & Error Normalization
// ─────────────────────────────────────────────────────────────────

async function executeLlmRequest({ provider, model, apiKey, messages, temperature = 0.2, jsonMode = false }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    if (provider === LLM_PROVIDERS.GEMINI) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const userMsg = messages.find(m => m.role === 'user')?.content || '';
      const combinedText = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

      const bodyPayload = {
        contents: [{ parts: [{ text: combinedText }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 8192
        }
      };

      if (jsonMode) {
        bodyPayload.generationConfig.responseMimeType = 'application/json';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = res.status;
        if (code === 400 || code === 403 || code === 401) {
          throw new Error('Authentication failed. Please verify your Gemini API key in Settings.');
        } else if (code === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else {
          const detail = errData.error?.message || res.statusText;
          throw new Error(`Gemini API Error (${code}): ${detail}`);
        }
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Received empty response from Gemini API.');
      return rawText.trim();

    } else {
      // OpenAI, OpenRouter, Groq
      let endpoint = 'https://api.openai.com/v1/chat/completions';
      if (provider === LLM_PROVIDERS.OPENROUTER) {
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      } else if (provider === LLM_PROVIDERS.GROQ) {
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      }

      const reqBody = {
        model,
        messages,
        temperature
      };

      if (jsonMode && (provider === LLM_PROVIDERS.OPENAI || provider === LLM_PROVIDERS.GROQ)) {
        reqBody.response_format = { type: 'json_object' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(reqBody),
        signal: controller.signal
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = res.status;
        if (code === 401 || code === 403) {
          throw new Error(`Authentication failed. Invalid API key for ${provider.toUpperCase()}.`);
        } else if (code === 429) {
          throw new Error(`Rate limit exceeded on ${provider.toUpperCase()}. Please wait before retrying.`);
        } else {
          const detail = errData.error?.message || res.statusText;
          throw new Error(`${provider.toUpperCase()} API Error (${code}): ${detail}`);
        }
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) throw new Error(`Received empty response from ${provider.toUpperCase()}.`);
      return rawText.trim();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('LLM request timed out after 35 seconds. Check your network or provider status.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper: Safe JSON Parser with Code-Fence Stripping
// ─────────────────────────────────────────────────────────────────

function safeParseJson(rawText) {
  if (!rawText) return null;
  // 1. Direct parse attempt
  try {
    return JSON.parse(rawText);
  } catch (e) {
    // continue to extraction
  }

  // 2. Strip markdown code fences ```json ... ``` or ``` ... ```
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {
      // continue
    }
  }

  // 3. Find first { and last }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = rawText.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // continue
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// 1. Edit Component with LLM (Structured JSON Output)
// ─────────────────────────────────────────────────────────────────

/**
 * Calls the LLM to edit the component according to natural language instructions.
 * Returns validated structured data: { html, css, changes }
 * 
 * @param {Object} params
 * @param {string} params.instruction User natural language prompt
 * @param {string} params.currentHtml Current component HTML
 * @param {string} [params.currentCss=''] Current component CSS
 * @param {Object} [params.elementData=null] Extracted element telemetry
 * @param {string} [params.theme='dark'] Active extension/canvas theme
 * @returns {Promise<{ html: string, css: string, changes: string[] }>}
 */
export async function callLlmEditComponent({ instruction, currentHtml, currentCss = '', elementData = null, theme = 'dark' }) {
  const config = await getLlmConfig();
  if (!config.apiKey) {
    throw new Error('API key not configured. Please open Settings and enter your API key.');
  }

  const systemPrompt = `You are a principal UI/UX frontend engineer specializing in precision DOM element manipulation.
Your task is to modify the provided HTML and CSS according to the user's instruction while maintaining the highest visual and structural fidelity.

CRITICAL REQUIREMENTS:
1. Return your response ONLY as a single valid JSON object with the exact keys:
   {
     "html": "<updated HTML markup for the component>",
     "css": "<updated CSS rules or inline styles needed to render the component>",
     "changes": ["summary of change 1", "summary of change 2"]
   }
2. DO NOT return markdown fences outside the JSON. DO NOT include explanations, greetings, or commentary.
3. Preserve existing component structure, nesting, text, assets, and classes unless the instruction explicitly requests changing them.
4. Keep the component self-contained: ensure any styles needed for the changes are included either inline in the HTML or in the "css" string.
5. Apply ONLY what is required by the user instruction. Do not rewrite unrelated styling.
6. The HTML must have a single root element matching the inspected component.
7. Canvas Theme context: ${theme} mode (Canvas is ${theme === 'dark' ? '#000000' : '#FFFFFF'}).
8. Never use external framework dependencies (e.g. no React/Vue syntax in HTML/CSS). Return clean, standards-compliant HTML+CSS.`;

  const tag = elementData?.tag || 'element';
  const userPrompt = `Inspected Target: <${tag}>
Current HTML:
${currentHtml}

Current CSS:
${currentCss || '/* none */'}

User Instruction:
"${instruction}"

Return the updated component as strict JSON:
{"html": "...", "css": "...", "changes": [...]}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const rawResult = await executeLlmRequest({
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey,
    messages,
    temperature: 0.2,
    jsonMode: true
  });

  const parsed = safeParseJson(rawResult);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM returned an invalid response format. The previous component has been preserved.');
  }

  if (!parsed.html || typeof parsed.html !== 'string' || !parsed.html.trim()) {
    throw new Error('LLM response was missing valid HTML markup. The previous component has been preserved.');
  }

  return {
    html: parsed.html.trim(),
    css: typeof parsed.css === 'string' ? parsed.css.trim() : '',
    changes: Array.isArray(parsed.changes) ? parsed.changes : ['Applied user style modifications']
  };
}

// ─────────────────────────────────────────────────────────────────
// 2. Dedicated React + Tailwind Component Generation
// ─────────────────────────────────────────────────────────────────

/**
 * Generates a clean, production-ready React component styled with Tailwind CSS.
 * 
 * @param {Object} params
 * @param {string} params.html Current HTML markup
 * @param {string} params.css Extracted CSS rules
 * @param {Object} params.elementData Telemetry data
 * @param {Array} [params.assets=[]] Media assets
 * @returns {Promise<string>} Clean JSX code
 */
export async function callLlmGenerateReact({ html, css, elementData = null, assets = [] }) {
  const config = await getLlmConfig();
  if (!config.apiKey) {
    throw new Error('API key not configured. Please open Settings and enter your API key.');
  }

  const systemPrompt = `You are a senior React and Tailwind CSS architect.
Your task is to convert the provided HTML and CSS into a production-grade, standalone React functional component styled with Tailwind CSS.

CRITICAL RULES:
1. Return ONLY the raw JSX/TSX component code.
2. DO NOT include markdown code fences (\`\`\`jsx or \`\`\`).
3. DO NOT include greetings, intro text, explanations, or usage examples.
4. The output must export a default function component, for example:
   export default function Component({ className = '', ...props }) {
     return ( ... );
   }
5. TAILWIND CSS REQUIREMENT:
   - Convert styling to Tailwind utility classes on className.
   - For values that cannot be represented with standard Tailwind classes, use arbitrary values:
     e.g. w-[347px], bg-[#123456], text-[17px], rounded-[13px], h-[52px].
   - DO NOT leave large inline style={{...}} objects; convert them into Tailwind classes.
6. WEB COMPONENTS SANITIZATION:
   - Custom elements (such as Polymer/Lit YouTube elements like <ytd-guide-entry-renderer>, <yt-formatted-string>, <yt-icon>, <tp-yt-paper-item>) MUST be converted to standard semantic HTML elements (div, span, button, section, nav, a, img, svg).
7. Preserve all child nesting, images, text, and visual appearance with pixel precision.
8. Ensure all void tags are self-closing (<img />, <input />, <br />).`;

  const tag = elementData?.tag || 'div';
  const userPrompt = `Target Element: <${tag}>
Original HTML:
${html}

Original CSS:
${css || '/* none */'}

Available Assets:
${JSON.stringify(assets.slice(0, 10), null, 2)}

Generate the complete React component with Tailwind CSS:`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const rawResult = await executeLlmRequest({
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey,
    messages,
    temperature: 0.1,
    jsonMode: false
  });

  // Strip accidental markdown fences
  let cleanCode = rawResult.trim();
  cleanCode = cleanCode.replace(/^```(?:jsx|tsx|javascript|react)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Basic validation that output contains a React component
  if (!cleanCode || (!cleanCode.includes('function') && !cleanCode.includes('return') && !cleanCode.includes('export'))) {
    throw new Error('LLM did not return a valid React component structure.');
  }

  return cleanCode;
}
