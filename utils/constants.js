/**
 * Qursor++ AI - Constants
 * 
 * Centralized constant definitions used across content scripts, background service worker, and popup.
 * Supports the complete master feature suite inside the Qursor visual design system.
 */

// Extension Action & Communication Keys
export const ACTIONS = {
  TOGGLE_INSPECT: 'TOGGLE_INSPECT',
  GET_INSPECT_STATE: 'GET_INSPECT_STATE',
  INSPECT_STATE_CHANGED: 'INSPECT_STATE_CHANGED',
  ELEMENT_SELECTED: 'ELEMENT_SELECTED',
  COPY_TO_CLIPBOARD: 'COPY_TO_CLIPBOARD',
  THEME_CHANGED: 'THEME_CHANGED',
};

// Inspector Operating States
export const INSPECTOR_STATE = {
  INACTIVE: 'INACTIVE',
  HOVERING: 'HOVERING',
  SELECTED: 'SELECTED',
};

// Qursor++ Master Navigation Bar Tabs
export const QURSOR_NAV_TABS = [
  { id: 'live', label: 'Live', icon: '👁️' },
  { id: 'overview', label: 'Overview', icon: 'ⓘ' },
  { id: 'typography', label: 'Typography', icon: 'T' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'dom', label: 'DOM Tree', icon: '🌲' },
  { id: 'code', label: 'Code', icon: '📄' },
  { id: 'edit', label: 'Edit', icon: '💬' },
  { id: 'assets', label: 'Assets', icon: '🖼️' },
  { id: 'prompt', label: 'AI Prompt', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Highlight Theme Styling Constants
export const OVERLAY_STYLES = {
  Z_INDEX: 2147483646,
};
