/**
 * DOMLens - Content Script ES Module Loader
 * 
 * Dynamically loads main inspector module as an ES Module in MV3 content script context.
 */

(async () => {
  try {
    const src = chrome.runtime.getURL('content/inspector.js');
    await import(src);
    console.log('[DOMLens] Content script module loaded successfully.');
  } catch (err) {
    console.error('[DOMLens] Failed to load content script module:', err);
  }
})();
