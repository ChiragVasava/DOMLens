/**
 * Qursor++ AI - Popup Logic
 * 
 * Synchronizes inspector state, theme preferences, and shortcuts with background service worker.
 */

import { ACTIONS } from '../utils/constants.js';
import { THEME_STORAGE_KEY, THEMES } from '../utils/theme.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const btnText = document.getElementById('btnText');
  const statusCard = document.getElementById('statusCard');
  const statusText = document.getElementById('statusText');
  const docBtn = document.getElementById('docBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const themeSwitcher = document.getElementById('themeSwitcher');

  // Initialize theme from storage
  chrome.storage.sync.get([THEME_STORAGE_KEY], (res) => {
    const theme = res[THEME_STORAGE_KEY] || THEMES.DARK;
    applyTheme(theme);
  });

  // Handle Theme Switching
  themeSwitcher.addEventListener('click', (e) => {
    const btn = e.target.closest('.theme-btn');
    if (!btn) return;
    const val = btn.dataset.themeVal;
    applyTheme(val);
    chrome.storage.sync.set({ [THEME_STORAGE_KEY]: val });

    // Notify active content script tabs
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: ACTIONS.THEME_CHANGED, theme: val }).catch(() => {});
      }
    });
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeSwitcher.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.themeVal === theme);
    });
  }

  // Initialize status from background storage
  chrome.runtime.sendMessage({ action: ACTIONS.GET_INSPECT_STATE }, (response) => {
    if (response && response.active !== undefined) {
      updateUI(response.active);
    }
  });

  // Toggle Inspect Mode button click
  toggleBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_INSPECT }, (response) => {
      if (response && response.active !== undefined) {
        updateUI(response.active);
      }
    });
  });

  // Documentation button click
  docBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: 'https://github.com/ChiragVasava/DOMLens'
    });
  });

  // Settings button click placeholder
  settingsBtn.addEventListener('click', () => {
    alert('Qursor++ AI Inspector Settings: Theme, Keyboard Shortcuts, and AI Prompt Rules configured via Popup and Panel controls.');
  });

  /**
   * Updates Popup UI state elements
   * @param {boolean} isActive 
   */
  function updateUI(isActive) {
    if (isActive) {
      statusCard.classList.add('active');
      statusText.textContent = 'Active (Hover element)';
      btnText.textContent = 'Disable Inspector';
      toggleBtn.classList.add('btn-active');
    } else {
      statusCard.classList.remove('active');
      statusText.textContent = 'Inactive';
      btnText.textContent = 'Enable Inspector';
      toggleBtn.classList.remove('btn-active');
    }
  }
});
