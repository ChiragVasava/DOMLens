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

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export const DEFAULT_MODELS = {
  [LLM_PROVIDERS.GEMINI]: DEFAULT_GEMINI_MODEL,
  [LLM_PROVIDERS.OPENAI]: 'gpt-4o-mini',
  [LLM_PROVIDERS.OPENROUTER]: 'google/gemini-2.0-flash-001',
  [LLM_PROVIDERS.GROQ]: 'llama-3.3-70b-versatile'
};

export const VERIFIED_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest'
];

const REQUEST_TIMEOUT_MS = 35000;

/**
 * Discovers available Gemini models supporting generateContent using the user's API key
 * @param {string} apiKey
 * @returns {Promise<string[]>} List of model names
 */
export async function discoverGeminiModels(apiKey) {
  if (!apiKey) return VERIFIED_GEMINI_MODELS;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`, {
      method: 'GET'
    });
    if (!res.ok) return VERIFIED_GEMINI_MODELS;
    const data = await res.json();
    if (Array.isArray(data.models)) {
      const valid = data.models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''))
        .filter(name => name.includes('flash') || name.includes('pro'));
      if (valid.length > 0) return valid;
    }
  } catch (e) {
    console.warn('[Qursor++ LLM] Model discovery failed, using verified fallback list:', e);
  }
  return VERIFIED_GEMINI_MODELS;
}

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
      let model = res.qursor_llm_model || DEFAULT_MODELS[provider] || DEFAULT_GEMINI_MODEL;
      // Upgrade obsolete or superseded models to latest stable Flash model
      if (model.includes('1.5') || model === 'gemini-2.0-flash' || model === 'gemini-2.5-flash' || model === 'gemini-3.6-flash') {
        model = DEFAULT_GEMINI_MODEL;
      }
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
  let resolvedModel = model || DEFAULT_MODELS[resolvedProvider] || DEFAULT_GEMINI_MODEL;
  if (resolvedModel.includes('1.5') || resolvedModel === 'gemini-2.0-flash' || resolvedModel === 'gemini-2.5-flash' || resolvedModel === 'gemini-3.6-flash') {
    resolvedModel = DEFAULT_GEMINI_MODEL;
  }

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
// Core HTTP Fetch with Timeout, Schema Support & Error Normalization
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
        bodyPayload.generationConfig.responseSchema = {
          type: 'OBJECT',
          properties: {
            html: { type: 'STRING' },
            css: { type: 'STRING' },
            changes: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          },
          required: ['html', 'css', 'changes']
        };
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
        const detail = errData.error?.message || res.statusText || 'Unknown error';

        if (code === 404) {
          throw new Error(`Configured Gemini model (${model}) is unavailable. Please select a supported model in Settings.`);
        } else if (code === 401 || code === 403) {
          throw new Error('Authentication failed (401/403). Please verify your Gemini API key in Settings.');
        } else if (code === 429) {
          throw new Error('Gemini API rate limit exceeded (429). Please wait a moment before trying again.');
        } else if (code === 503 || code === 500) {
          throw new Error(`Gemini server temporarily unavailable (${code}). Server busy or no model capacity. Please retry shortly.`);
        } else if (code === 400) {
          throw new Error(`Gemini API bad request (400): ${detail}`);
        } else {
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
        const detail = errData.error?.message || res.statusText || 'Unknown error';

        if (code === 401 || code === 403) {
          throw new Error(`Authentication failed. Invalid API key for ${provider.toUpperCase()}.`);
        } else if (code === 429) {
          throw new Error(`Rate limit exceeded on ${provider.toUpperCase()}. Please wait before retrying.`);
        } else if (code === 503 || code === 500) {
          throw new Error(`${provider.toUpperCase()} service temporarily unavailable (${code}). Please retry shortly.`);
        } else {
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
// Helper: Safe JSON Parser with Code-Fence Stripping & Robust Extraction
// ─────────────────────────────────────────────────────────────────

function safeParseJson(rawText) {
  if (!rawText) return null;
  // 1. Direct parse attempt
  try {
    return JSON.parse(rawText);
  } catch (e) {}

  // 2. Strip markdown code fences ```json ... ``` or ``` ... ```
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {}
  }

  // 3. Find outermost { and }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = rawText.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────
// 1. Edit Component with LLM (Structured JSON Output & Minimal Surgery)
// ─────────────────────────────────────────────────────────────────

/**
 * Calls the LLM to edit the component according to natural language instructions.
 * Enforces surgical modifications on existing component without redesigning unrelated styles.
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

  const systemPrompt = `You are editing an existing HTML/CSS component.

CRITICAL EDIT PRINCIPLES:
1. You are modifying an EXISTING component, NOT creating a new design from scratch.
2. PRESERVE EVERYTHING that the user did not explicitly request to change.
3. Modify ONLY what is necessary to satisfy the user's instruction.
4. DO NOT change dimensions, typography, spacing, layout, colors, assets, or structure unless the user's instruction requires it.
5. Example: If the user says 'Change Sunita Williams to Einstein Williams', change ONLY that text and keep all other text, fonts, images, sizes, and colors 100% untouched.
6. Return your response as a strict JSON object matching this schema:
   {
     "html": "<complete updated HTML>",
     "css": "<complete updated CSS>",
     "changes": ["<concise description of each applied change>"]
   }
7. Return clean standards-compliant HTML and CSS. Single root element matching inspected element.
8. No markdown code blocks outside JSON. No explanatory preamble.`;

  const tag = elementData?.tag || 'element';
  const userPrompt = `Target Component: <${tag}>
Current Component HTML:
${currentHtml}

Current Component CSS:
${currentCss || '/* none */'}

User Instruction:
"${instruction}"

Return the complete updated component JSON:`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let rawResult = await executeLlmRequest({
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey,
    messages,
    temperature: 0.1,
    jsonMode: true
  });

  let parsed = safeParseJson(rawResult);

  // Auto-Repair Attempt (Phase 14): If response was invalid, perform 1 repair attempt
  if (!parsed || typeof parsed !== 'object' || typeof parsed.html !== 'string' || !parsed.html.trim()) {
    console.warn('[Qursor++ LLM] Initial response was invalid JSON schema. Attempting 1 repair request...');
    try {
      const repairRaw = await executeLlmRequest({
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON with keys: "html" (string), "css" (string), "changes" (array of strings). Do not include markdown.' },
          { role: 'user', content: `Please convert this output into valid JSON for the instruction "${instruction}":\n${rawResult}` }
        ],
        temperature: 0.0,
        jsonMode: true
      });
      parsed = safeParseJson(repairRaw);
    } catch (repairErr) {
      console.warn('[Qursor++ LLM] Repair attempt failed:', repairErr);
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM returned an invalid response format. The previous component has been preserved.');
  }

  if (!parsed.html || typeof parsed.html !== 'string' || !parsed.html.trim()) {
    throw new Error('LLM response was missing valid HTML markup. The previous component has been preserved.');
  }

  return {
    html: parsed.html.trim(),
    css: typeof parsed.css === 'string' ? parsed.css.trim() : '',
    changes: Array.isArray(parsed.changes) ? parsed.changes : ['Applied user modifications']
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
