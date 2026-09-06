/**
 * Qursor++ - Background Service Worker
 * 
 * Manages extension state, handles command shortcuts, and orchestrates messaging
 * between Popup UI and Active Tab content scripts.
 */

import { ACTIONS } from '../utils/constants.js';

// Initialize storage defaults on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    inspectModeActive: false,
    version: '1.0.0'
  });
  console.log('[Qursor++] Extension installed successfully.');
});

// Command listener (Ctrl+Shift+I / Cmd+Shift+I)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-inspect-mode') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      toggleTabInspectMode(tab.id);
    }
  }
});

// Runtime message dispatcher
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === ACTIONS.TOGGLE_INSPECT) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab && tab.id) {
        toggleTabInspectMode(tab.id, sendResponse);
      }
    });
    return true; // async response handle
  }

  if (message.action === ACTIONS.GET_INSPECT_STATE) {
    chrome.storage.local.get(['inspectModeActive'], (result) => {
      sendResponse({ active: !!result.inspectModeActive });
    });
    return true;
  }
});

/**
 * Toggles inspect state for a specific tab and updates local storage
 * @param {number} tabId 
 * @param {Function} [sendResponse] 
 */
async function toggleTabInspectMode(tabId, sendResponse = null) {
  try {
    const { inspectModeActive } = await chrome.storage.local.get(['inspectModeActive']);
    const newState = !inspectModeActive;

    await chrome.storage.local.set({ inspectModeActive: newState });

    // Send toggle state to content script in target tab
    chrome.tabs.sendMessage(tabId, {
      action: ACTIONS.INSPECT_STATE_CHANGED,
      active: newState
    }).catch(async (err) => {
      // Content script may not be loaded yet; dynamically inject loader script
      console.warn('[Qursor++] Direct message failed, injecting content loader script...', err);
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content/loader.js']
        });
        // Retry message after injection
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: ACTIONS.INSPECT_STATE_CHANGED,
            active: newState
          });
        }, 150);
      } catch (injectErr) {
        console.error('[Qursor++] Injection failed:', injectErr);
      }
    });

    if (sendResponse) {
      sendResponse({ success: true, active: newState });
    }
  } catch (err) {
    console.error('[Qursor++] Toggle state error:', err);
    if (sendResponse) sendResponse({ success: false, error: err.message });
  }
}
