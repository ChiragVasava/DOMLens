/**
 * Qursor++ - Content Script ES Module Loader
 * 
 * Dynamically loads main inspector module as an ES Module in MV3 content script context.
 */

(async () => {
  try {
    const src = chrome.runtime.getURL('content/inspector.js');
    await import(src);
    console.log('[Qursor++] Content script module loaded successfully.');
  } catch (err) {
    console.error('[Qursor++] Failed to load content script module:', err);
  }
})();
