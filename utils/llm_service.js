/**
 * Qursor++ AI - LLM Service Integration
 * 
 * Securely calls LLM APIs (Google Gemini, OpenAI, OpenRouter, Groq)
 * using the user-provided API key stored in chrome.storage.sync.
 * Edits HTML components according to natural language instructions.
 */

export const LLM_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  OPENROUTER: 'openrouter',
  GROQ: 'groq'
};

const DEFAULT_MODELS = {
  [LLM_PROVIDERS.GEMINI]: 'gemini-1.5-flash',
  [LLM_PROVIDERS.OPENAI]: 'gpt-4o-mini',
  [LLM_PROVIDERS.OPENROUTER]: 'google/gemini-2.0-flash-001',
  [LLM_PROVIDERS.GROQ]: 'llama-3.3-70b-versatile'
};

/**
 * Auto-detects provider based on the format of the API key
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
 * Retrieves the stored API key and LLM configuration
 */
export async function getLlmConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['qursor_api_key', 'qursor_llm_provider', 'qursor_llm_model'], (res) => {
      const apiKey = (res.qursor_api_key || '').trim();
      const provider = res.qursor_llm_provider || detectProvider(apiKey);
      const model = res.qursor_llm_model || DEFAULT_MODELS[provider] || 'gemini-1.5-flash';
      resolve({ apiKey, provider, model });
    });
  });
}

/**
 * Persists the API key and LLM configuration to chrome.storage
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
      resolve({ apiKey: cleanKey, provider: resolvedProvider, model: resolvedModel });
    });
  });
}

/**
 * Calls the user-configured LLM to edit the component according to the prompt
 * 
 * @param {Object} options
 * @param {string} options.prompt - Natural language edit instruction
 * @param {string} options.currentHtml - Current HTML snippet of the element with inlined styles
 * @param {string} [options.componentTag='div'] - Tag name of the element
 * @returns {Promise<string>} - Modified self-contained HTML
 */
export async function callLlmEditComponent({ prompt, currentHtml, componentTag = 'div' }) {
  const config = await getLlmConfig();
  if (!config.apiKey) {
    throw new Error('No API key found. Please enter your API key in the Settings tab.');
  }

  const systemInstruction = `You are a world-class UI/UX designer and frontend engineer.
Your task is to edit an HTML component according to the user's natural language instruction.
CRITICAL RULES:
1. Return ONLY the raw HTML of the modified component.
2. DO NOT wrap the output in markdown code fences like \`\`\`html. Output pure HTML string only.
3. DO NOT include greetings, commentary, markdown headings, or explanations.
4. Inline all visual styling using standard style="..." attributes on every modified element so the component is completely self-contained and renders accurately anywhere.
5. Preserve essential text, icons, and semantics unless the user explicitly requested changing them.
6. The outermost element MUST be the single root component container (e.g. <${componentTag}>...</${componentTag}>).`;

  const userContent = `Current HTML Component with computed styles:
${currentHtml}

User Edit Instruction:
"${prompt}"

Please modify the component to fulfill the instruction. Output ONLY the updated HTML with inline style="..." attributes.`;

  let responseText = '';

  if (config.provider === LLM_PROVIDERS.GEMINI) {
    // Google Gemini API call
    const model = config.model || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemInstruction}\n\n${userContent}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(`Gemini API Error: ${msg}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('Gemini API returned an empty response.');
    }
    responseText = candidate.content.parts[0].text;

  } else {
    // OpenAI, OpenRouter, or Groq (standard OpenAI-compatible chat completions)
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === LLM_PROVIDERS.OPENROUTER) {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    } else if (config.provider === LLM_PROVIDERS.GROQ) {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    }

    const modelName = config.model || DEFAULT_MODELS[config.provider] || 'gpt-4o-mini';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(`${config.provider.toUpperCase()} API Error: ${msg}`);
    }

    const data = await res.json();
    responseText = data.choices?.[0]?.message?.content || '';
  }

  // Strip accidental markdown fences like ```html ... ```
  let cleanHtml = responseText.trim();
  cleanHtml = cleanHtml.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim();

  if (!cleanHtml) {
    throw new Error('Received empty response from the LLM model.');
  }

  return cleanHtml;
}
