/**
 * Website Inspector AI - Constants
 * 
 * Centralized constant definitions used across content scripts, background service worker, and popup.
 * Avoids magic strings and ensures type consistency.
 */

// Extension Action & Communication Keys
export const ACTIONS = {
  TOGGLE_INSPECT: 'TOGGLE_INSPECT',
  GET_INSPECT_STATE: 'GET_INSPECT_STATE',
  INSPECT_STATE_CHANGED: 'INSPECT_STATE_CHANGED',
  ELEMENT_SELECTED: 'ELEMENT_SELECTED',
  COPY_TO_CLIPBOARD: 'COPY_TO_CLIPBOARD',
};

// Inspector Operating States
export const INSPECTOR_STATE = {
  INACTIVE: 'INACTIVE',
  HOVERING: 'HOVERING',
  SELECTED: 'SELECTED',
};

// UI Panel Tabs
export const PANEL_TABS = [
  { id: 'general', label: 'General', icon: 'ⓘ' },
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'typography', label: 'Typography', icon: '🔤' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'spacing', label: 'Spacing', icon: '📏' },
  { id: 'border', label: 'Border', icon: '🔲' },
  { id: 'flex', label: 'Flex & Grid', icon: '▦' },
  { id: 'dom', label: 'DOM', icon: '🌲' },
  { id: 'attributes', label: 'Attributes', icon: '🏷️' },
  { id: 'html', label: 'HTML', icon: '〈/〉' },
  { id: 'css', label: 'CSS', icon: '🎨' },
];

// Highlight Theme Styling Constants
export const OVERLAY_STYLES = {
  HOVER_BORDER: '2px solid #3b82f6',
  HOVER_BG: 'rgba(59, 130, 246, 0.15)',
  SELECTED_BORDER: '2px solid #10b981',
  SELECTED_BG: 'rgba(16, 185, 129, 0.15)',
  Z_INDEX: 2147483646,
};
