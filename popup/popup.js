/**
 * Qursor++ - Popup Logic
 * 
 * Synchronizes inspector state with background service worker and active tab.
 */

import { ACTIONS } from '../utils/constants.js';

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const btnText = document.getElementById('btnText');
  const statusCard = document.getElementById('statusCard');
  const statusText = document.getElementById('statusText');
  const docBtn = document.getElementById('docBtn');
  const settingsBtn = document.getElementById('settingsBtn');

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
      url: 'https://developer.chrome.com/docs/extensions/mv3/'
    });
  });

  // Settings button click placeholder
  settingsBtn.addEventListener('click', () => {
    alert('Qursor++ Settings (Phase 2 feature coming soon)');
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
