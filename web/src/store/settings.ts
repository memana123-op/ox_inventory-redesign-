import { useSyncExternalStore } from 'react';
import { fetchNui } from '../utils/fetchNui';

export interface InventorySettings {
  accent: string;
  neutral: string;
  transparency: number; // 0..100, how much of the game world is dimmed
  scale: number; // 80..120 (%)
  volume: number; // 0..100
  highContrast: boolean; // light tooltips & context menus
  layout: 'default' | 'mirrored'; // column arrangement
}

export const ACCENT_PRESETS = [
  '#3fe08f', // emerald (default)
  '#64e2f0', // cyan
  '#4f8cff', // blue
  '#7c5cff', // violet
  '#ff5c7a', // rose
  '#ff8a3d', // orange
  '#ffd94d', // gold
  '#e8ecf5', // mono
];

export const NEUTRAL_PRESETS = [
  '#0b0a14', // ink (default)
  '#0d1117', // slate
  '#101417', // graphite
  '#14100d', // umber
];

const DEFAULTS: InventorySettings = {
  accent: ACCENT_PRESETS[0],
  neutral: NEUTRAL_PRESETS[0],
  transparency: 55,
  scale: 100,
  volume: 35,
  highContrast: false,
  layout: 'default',
};

const STORAGE_KEY = 'ox_inventory:settings';

let settings: InventorySettings = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
})();

const listeners = new Set<() => void>();

const hexToRgb = (hex: string): [number, number, number] => {
  const value = parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const applyCssVars = () => {
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(settings.accent);
  const [nr, ng, nb] = hexToRgb(settings.neutral);
  root.style.setProperty('--accent', settings.accent);
  root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--accent-faint', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--neutral-rgb', `${nr}, ${ng}, ${nb}`);
  root.style.setProperty('--bg-alpha', String(settings.transparency / 100));

  if (settings.highContrast) root.setAttribute('data-high-contrast', '1');
  else root.removeAttribute('data-high-contrast');

  root.setAttribute('data-layout', settings.layout);
};

// the ped preview camera mirrors its framing when the layout flips
const syncLayoutToClient = () => {
  fetchNui('inventoryLayout', { mirrored: settings.layout === 'mirrored' }).catch(() => {});
};

applyCssVars();
syncLayoutToClient();

export const getSettings = () => settings;

export const setSettings = (patch: Partial<InventorySettings>) => {
  const layoutChanged = patch.layout !== undefined && patch.layout !== settings.layout;
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable in some NUI contexts; settings stay in-memory
  }
  applyCssVars();
  if (layoutChanged) syncLayoutToClient();
  listeners.forEach((listener) => listener());
};

export const resetSettings = () => setSettings({ ...DEFAULTS });

export const useSettings = (): InventorySettings =>
  useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, getSettings);
