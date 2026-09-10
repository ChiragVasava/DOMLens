/**
 * Qursor++ AI - Constants
 * 
 * Centralized constant definitions used across content scripts, background service worker, and popup.
 * Supports design system tokens and tab architecture.
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

// UI Panel Tabs (12 Structured Developer-Focused Tabs)
export const PANEL_TABS = [
  { id: 'overview', label: 'Overview', icon: 'ⓘ' },
  { id: 'styles', label: 'Styles', icon: '🎨' },
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'typography', label: 'Typography', icon: '🔤' },
  { id: 'colors', label: 'Colors', icon: '💧' },
  { id: 'spacing', label: 'Spacing', icon: '📏' },
  { id: 'border', label: 'Border', icon: '🔲' },
  { id: 'flex', label: 'Flex & Grid', icon: '▦' },
  { id: 'dom', label: 'DOM', icon: '🌲' },
  { id: 'accessibility', label: 'A11y', icon: '♿' },
  { id: 'component', label: 'Component', icon: '⚛️' },
  { id: 'prompt', label: 'AI Prompt', icon: '✨' },
];

// Highlight Theme Styling Constants (Uses Design Tokens in Overlay CSS)
export const OVERLAY_STYLES = {
  Z_INDEX: 2147483646,
};
