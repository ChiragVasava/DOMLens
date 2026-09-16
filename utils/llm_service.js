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

export const PROVIDER_FREE_MODELS = {
  [LLM_PROVIDERS.GEMINI]: [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Primary - Recommended)' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Fallback 1)' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Fallback 2)' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Fallback 3)' },
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Low-Latency Fallback)' }
  ],
  [LLM_PROVIDERS.GROQ]: [
    { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (Latest 2026 - Recommended)' },
    { id: 'llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick (Reasoning & Multimodal)' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast)' }
  ],
  [LLM_PROVIDERS.OPENROUTER]: [
    { id: 'openrouter/free', name: 'OpenRouter Free Router (Auto Best Free Model - Recommended)' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free / $0)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free / $0)' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free / $0)' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free / $0)' }
  ],
  [LLM_PROVIDERS.OPENAI]: [
    { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna (Latest 2026 Cost-Optimized - Recommended)' },
    { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra (Balanced 2026 Workhorse)' },
    { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol (Flagship Frontier 2026)' },
    { id: 'o4-mini', name: 'o4-mini (Fast Reasoning)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Legacy)' }
  ]
};

export const DEFAULT_MODELS = {
  [LLM_PROVIDERS.GEMINI]: 'gemini-3.8-flash',
  [LLM_PROVIDERS.OPENAI]: 'gpt-5.6-luna',
  [LLM_PROVIDERS.OPENROUTER]: 'openrouter/free',
  [LLM_PROVIDERS.GROQ]: 'llama-4-scout-17b-16e-instruct'
};

export const VERIFIED_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite'
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
  if (typeof chrome === 'undefined' || !chrome?.storage?.sync) {
    return {
      apiKey: '',
      provider: LLM_PROVIDERS.GEMINI,
      model: DEFAULT_GEMINI_MODEL,
      isConfigured: false
    };
  }
  return new Promise((resolve) => {
    chrome.storage.sync.get(['qursor_api_key', 'qursor_llm_provider', 'qursor_llm_model'], (res) => {
      const apiKey = (res.qursor_api_key || '').trim();
      const provider = res.qursor_llm_provider || detectProvider(apiKey);
      let model = res.qursor_llm_model || DEFAULT_MODELS[provider] || DEFAULT_GEMINI_MODEL;
      if (
        provider === LLM_PROVIDERS.GEMINI &&
        (model.includes('1.5') || model.includes('2.0') || model.includes('2.5') || model.includes('live'))
      ) {
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
  if (
    resolvedProvider === LLM_PROVIDERS.GEMINI &&
    (resolvedModel.includes('1.5') || resolvedModel.includes('2.0') || resolvedModel.includes('2.5') || resolvedModel.includes('live'))
  ) {
    resolvedModel = DEFAULT_GEMINI_MODEL;
  }

  if (typeof chrome === 'undefined' || !chrome?.storage?.sync) {
    return {
      apiKey: cleanKey,
      provider: resolvedProvider,
      model: resolvedModel,
      isConfigured: !!cleanKey
    };
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
  if (typeof chrome === 'undefined' || !chrome?.storage?.sync) {
    return true;
  }
  return new Promise((resolve) => {
    chrome.storage.sync.remove(['qursor_api_key', 'qursor_llm_provider', 'qursor_llm_model'], () => {
      resolve(true);
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Core HTTP Fetch with Timeout, Schema Support & Error Normalization
// ─────────────────────────────────────────────────────────────────

/**
 * Resolves candidate fallback models in priority order for the given provider.
 * Begins with the user-selected primary model, followed by all other verified free models for that provider.
 * Excludes obsolete or shut-down models.
 * @param {string} provider 
 * @param {string} primaryModel 
 * @returns {string[]} Ordered list of unique model IDs to try
 */
export function getFallbackModels(provider, primaryModel) {
  const allowedModels = (PROVIDER_FREE_MODELS[provider] || []).map(m => m.id);
  const isObsolete = (id) => !id || id.includes('1.5') || id.includes('2.0') || id.includes('2.5') || id.includes('live');

  let effectivePrimary = primaryModel;
  if (provider === LLM_PROVIDERS.GEMINI && (isObsolete(effectivePrimary) || !allowedModels.includes(effectivePrimary))) {
    effectivePrimary = DEFAULT_GEMINI_MODEL;
  }

  const candidates = [effectivePrimary, ...allowedModels.filter(id => id !== effectivePrimary)];
  return [...new Set(candidates.filter(Boolean))];
}

export async function executeLlmRequest({
  provider,
  model,
  apiKey,
  messages,
  temperature = 0.2,
  jsonMode = false,
  requestId = null,
  signal = null,
  maxRetriesPerModel = 1,
  backoffMs = 1500,
  returnMeta = false
}) {
  const reqId = requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'edit-' + Date.now());
  const candidateModels = getFallbackModels(provider, model);
  let lastError = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const activeModel = candidateModels[mIdx];
    let attempt = 0;

    while (attempt <= maxRetriesPerModel) {
      console.log(`[LLM EDIT ${reqId}] model=${activeModel} attempt=${attempt + 1}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const onExternalAbort = () => controller.abort();
      if (signal) {
        if (signal.aborted) {
          clearTimeout(timeoutId);
          throw new Error('LLM request was canceled.');
        }
        signal.addEventListener('abort', onExternalAbort, { once: true });
      }

      try {
        if (provider === LLM_PROVIDERS.GEMINI) {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;
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

          console.log(`[LLM EDIT ${reqId}] status=${res.status}`);

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error('Received empty response from Gemini API.');
            const trimmed = rawText.trim();
            return returnMeta ? { text: trimmed, model: activeModel, reqId } : trimmed;
          }

          const errData = await res.json().catch(() => ({}));
          const code = res.status;
          const detail = errData.error?.message || res.statusText || 'Unknown error';

          // Rule 4: 401/403 -> stop and report authentication/permission problem
          if (code === 401 || code === 403) {
            throw new Error('Authentication failed (401/403). Please verify your Gemini API key in Settings.');
          }

          // Rule 4: 400 -> stop and report invalid request
          if (code === 400) {
            throw new Error(`Gemini API bad request (400): ${detail}`);
          }

          // Rule 3 & 4: 404 -> immediately skip model. Do not retry on 404!
          if (code === 404) {
            if (mIdx < candidateModels.length - 1) {
              const nextModel = candidateModels[mIdx + 1];
              console.log(`[LLM EDIT ${reqId}] fallback=${nextModel}`);
              clearTimeout(timeoutId);
              break;
            }
            throw new Error(`Configured Gemini model (${activeModel}) is unavailable (404).`);
          }

          // Rule 4: 503 & 429 -> bounded retry/backoff, then fallback
          if (code === 503 || code === 429 || code === 500) {
            if (attempt < maxRetriesPerModel) {
              attempt++;
              clearTimeout(timeoutId);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
              continue;
            }

            if (mIdx < candidateModels.length - 1) {
              const nextModel = candidateModels[mIdx + 1];
              console.log(`[LLM EDIT ${reqId}] fallback=${nextModel}`);
              clearTimeout(timeoutId);
              break;
            }

            if (code === 429) {
              throw new Error('Gemini API rate limit exceeded (429). Please wait a moment before trying again.');
            }
            throw new Error('Gemini is temporarily unavailable across all fallback models. Your previous component was preserved.');
          }

          throw new Error(`Gemini API Error (${code}): ${detail}`);

        } else {
          // OpenAI, OpenRouter, Groq
          let endpoint = 'https://api.openai.com/v1/chat/completions';
          if (provider === LLM_PROVIDERS.OPENROUTER) {
            endpoint = 'https://openrouter.ai/api/v1/chat/completions';
          } else if (provider === LLM_PROVIDERS.GROQ) {
            endpoint = 'https://api.groq.com/openai/v1/chat/completions';
          }

          const reqBody = {
            model: activeModel,
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

          console.log(`[LLM EDIT ${reqId}] status=${res.status}`);

          if (res.ok) {
            const data = await res.json();
            const rawText = data.choices?.[0]?.message?.content;
            if (!rawText) throw new Error(`Received empty response from ${provider.toUpperCase()}.`);
            const trimmed = rawText.trim();
            return returnMeta ? { text: trimmed, model: activeModel, reqId } : trimmed;
          }

          const errData = await res.json().catch(() => ({}));
          const code = res.status;
          const detail = errData.error?.message || res.statusText || 'Unknown error';

          if (code === 401 || code === 403) {
            throw new Error(`Authentication failed. Invalid API key for ${provider.toUpperCase()}.`);
          }

          if (code === 400) {
            throw new Error(`${provider.toUpperCase()} bad request (400): ${detail}`);
          }

          if (code === 404) {
            if (mIdx < candidateModels.length - 1) {
              const nextModel = candidateModels[mIdx + 1];
              console.log(`[LLM EDIT ${reqId}] fallback=${nextModel}`);
              clearTimeout(timeoutId);
              break;
            }
            throw new Error(`${provider.toUpperCase()} model (${activeModel}) unavailable (404).`);
          }

          if (code === 503 || code === 429 || code === 500) {
            if (attempt < maxRetriesPerModel) {
              attempt++;
              clearTimeout(timeoutId);
              await new Promise(resolve => setTimeout(resolve, backoffMs));
              continue;
            }

            if (mIdx < candidateModels.length - 1) {
              const nextModel = candidateModels[mIdx + 1];
              console.log(`[LLM EDIT ${reqId}] fallback=${nextModel}`);
              clearTimeout(timeoutId);
              break;
            }

            if (code === 429) {
              throw new Error(`Rate limit exceeded on ${provider.toUpperCase()}. Please wait before retrying.`);
            }
            throw new Error(`${provider.toUpperCase()} service temporarily unavailable (${code}). Please retry shortly.`);
          }

          throw new Error(`${provider.toUpperCase()} API Error (${code}): ${detail}`);
        }
      } catch (err) {
        lastError = err;
        if (err.name === 'AbortError' || err.message?.includes('canceled')) {
          throw new Error('LLM request was canceled or timed out.');
        }

        if (err.message && (err.message.includes('Authentication') || err.message.includes('401') || err.message.includes('403') || err.message.includes('bad request (400)'))) {
          throw err;
        }

        if (mIdx < candidateModels.length - 1) {
          const nextModel = candidateModels[mIdx + 1];
          console.log(`[LLM EDIT ${reqId}] fallback=${nextModel}`);
          clearTimeout(timeoutId);
          break;
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onExternalAbort);
        }
      }
      attempt++;
    }
  }

  if (lastError) throw lastError;
  throw new Error('All model endpoints failed to respond.');
}

// ─────────────────────────────────────────────────────────────────
// Helper: Safe JSON Parser with Code-Fence Stripping & Robust Extraction
// ─────────────────────────────────────────────────────────────────

function sanitizeJsonString(str) {
  let inString = false;
  let escaped = false;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escaped) {
      inString = !inString;
      out += char;
    } else if (inString) {
      if (char === '\n') {
        out += '\\n';
      } else if (char === '\r') {
        out += '\\r';
      } else if (char === '\t') {
        out += '\\t';
      } else {
        out += char;
      }
    } else {
      out += char;
    }
    escaped = (char === '\\' && !escaped);
  }
  return out;
}

function normalizeParsedSchema(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.result && typeof obj.result === 'object' && typeof obj.result.html === 'string') {
    return normalizeParsedSchema(obj.result);
  }
  if (obj.data && typeof obj.data === 'object' && typeof obj.data.html === 'string') {
    return normalizeParsedSchema(obj.data);
  }
  return obj;
}

export function safeParseJson(rawText) {
  if (!rawText) return null;

  // 1. Direct parse attempt
  try {
    const obj = JSON.parse(rawText);
    return normalizeParsedSchema(obj);
  } catch (e) {}

  // 2. Strip markdown code fences ```json ... ``` or ``` ... ```
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      const obj = JSON.parse(fenceMatch[1].trim());
      return normalizeParsedSchema(obj);
    } catch (e) {
      try {
        const obj = JSON.parse(sanitizeJsonString(fenceMatch[1].trim()));
        return normalizeParsedSchema(obj);
      } catch (e2) {}
    }
  }

  // 3. Find outermost { and }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    let candidate = rawText.substring(firstBrace, lastBrace + 1);
    try {
      const obj = JSON.parse(candidate);
      return normalizeParsedSchema(obj);
    } catch (e) {
      try {
        const sanitized = sanitizeJsonString(candidate);
        const obj = JSON.parse(sanitized);
        return normalizeParsedSchema(obj);
      } catch (e2) {
        try {
          const noTrailing = candidate.replace(/,\s*([}\]])/g, '$1');
          const obj = JSON.parse(sanitizeJsonString(noTrailing));
          return normalizeParsedSchema(obj);
        } catch (e3) {}
      }
    }
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
export async function callLlmEditComponent({
  instruction,
  currentHtml,
  currentCss = '',
  elementData = null,
  theme = 'dark',
  requestId = null,
  signal = null
}) {
  const reqId = requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'edit-' + Date.now());
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
5. If the user instruction only changes text, DO NOT change any CSS rules.
6. Return your response as a strict JSON object matching this schema:
   {
     "html": "<complete updated HTML>",
     "css": "<complete updated CSS>",
     "changes": ["<concise description of each applied change>"]
   }
7. Return clean standards-compliant HTML and CSS. Single root element matching inspected element.
8. No markdown code blocks outside JSON. No explanatory preamble.`;

  const tag = elementData?.tag || 'element';
  // Context optimization (Section 8): Do not send giant stylesheets that overflow token limits
  const safeCss = currentCss.length > 8000 ? currentCss.substring(0, 8000) + '\n/* ... truncated remaining rules ... */' : currentCss;

  const userPrompt = `Target Component: <${tag}>
Current Component HTML:
${currentHtml}

Current Component CSS:
${safeCss || '/* none */'}

User Instruction:
"${instruction}"

Return the complete updated component JSON:`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const resultMeta = await executeLlmRequest({
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey,
    messages,
    temperature: 0.1,
    jsonMode: true,
    requestId: reqId,
    signal,
    returnMeta: true
  });

  const rawResult = resultMeta.text;
  let parsed = safeParseJson(rawResult);

  // Auto-Repair Attempt (Phase 14): If response was invalid, perform 1 repair attempt using the model that succeeded
  if (!parsed || typeof parsed !== 'object' || typeof parsed.html !== 'string' || !parsed.html.trim()) {
    console.warn('[Qursor++ LLM] Initial response was invalid JSON schema. Attempting 1 repair request...');
    try {
      const repairRaw = await executeLlmRequest({
        provider: config.provider,
        model: resultMeta.model || config.model,
        apiKey: config.apiKey,
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON with keys: "html" (string), "css" (string), "changes" (array of strings). Do not include markdown.' },
          { role: 'user', content: `Please convert this output into valid JSON for the instruction "${instruction}":\n${rawResult}` }
        ],
        temperature: 0.0,
        jsonMode: true,
        requestId: `${reqId}-repair`,
        signal
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

  // Diff-based Safety (Section 10 & 11):
  // If the instruction only asked to change text, keep existing CSS byte-for-byte
  const lower = instruction.toLowerCase();
  const isStyleEdit = ['background', 'bg', 'color', 'padding', 'margin', 'border', 'font', 'size', 'width', 'height', 'radius', 'shadow', 'display'].some(k => lower.includes(k));
  let finalCss = typeof parsed.css === 'string' ? parsed.css.trim() : '';
  if (!isStyleEdit && currentCss) {
    finalCss = currentCss;
  }

  return {
    html: parsed.html.trim(),
    css: finalCss,
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
 * @param {string|null} [params.requestId=null]
 * @param {AbortSignal|null} [params.signal=null]
 * @returns {Promise<string>} Clean JSX code
 */
export async function callLlmGenerateReact({ html, css, elementData = null, assets = [], requestId = null, signal = null }) {
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
    jsonMode: false,
    requestId,
    signal
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
