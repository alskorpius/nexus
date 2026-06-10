import { getSetting, setSetting } from './db';

// ── Theme presets ────────────────────────────────────────────────────────────

export type ThemeId = 'nexus' | 'graphite' | 'emerald' | 'violet' | 'light';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  /** Accent color shown in the swatch button */
  swatchAccent: string;
  /** Background color shown in the swatch button */
  swatchBg: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'nexus',    label: 'Nexus',    swatchAccent: '#4fa8e0', swatchBg: '#090c12' },
  { id: 'graphite', label: 'Graphite', swatchAccent: '#9ca3af', swatchBg: '#111111' },
  { id: 'emerald',  label: 'Emerald',  swatchAccent: '#34d399', swatchBg: '#0a120f' },
  { id: 'violet',   label: 'Violet',   swatchAccent: '#a78bfa', swatchBg: '#0d0b18' },
  { id: 'light',    label: 'Light',    swatchAccent: '#2563eb', swatchBg: '#f4f6fa' },
];

// ── Apply theme ──────────────────────────────────────────────────────────────

export function applyTheme(id: ThemeId): void {
  if (id === 'nexus') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', id);
  }
}

// ── Branding state + pub/sub ─────────────────────────────────────────────────

export interface BrandingState {
  workspaceName: string;
  workspaceLogo: string; // data URL or empty string
  theme: ThemeId;
}

type BrandingListener = (state: BrandingState) => void;

const _listeners = new Set<BrandingListener>();
let _branding: BrandingState = { workspaceName: '', workspaceLogo: '', theme: 'nexus' };

export function subscribeBranding(fn: BrandingListener): () => void {
  _listeners.add(fn);
  // Immediately call with current state so the subscriber is up to date.
  fn({ ..._branding });
  return () => { _listeners.delete(fn); };
}

function _notify(): void {
  const snapshot = { ..._branding };
  _listeners.forEach(fn => fn(snapshot));
}

// ── Persist helpers ──────────────────────────────────────────────────────────

export async function saveWorkspaceName(name: string): Promise<void> {
  await setSetting('workspace_name', name);
  _branding = { ..._branding, workspaceName: name };
  _notify();
}

export async function saveWorkspaceLogo(logo: string): Promise<void> {
  await setSetting('workspace_logo', logo);
  _branding = { ..._branding, workspaceLogo: logo };
  _notify();
}

export async function saveTheme(id: ThemeId): Promise<void> {
  await setSetting('theme', id);
  _branding = { ..._branding, theme: id };
  applyTheme(id);
  _notify();
}

// ── Boot-time load ───────────────────────────────────────────────────────────

export async function loadBranding(): Promise<BrandingState> {
  const [name, logo, theme] = await Promise.all([
    getSetting('workspace_name'),
    getSetting('workspace_logo'),
    getSetting('theme'),
  ]);

  const resolvedTheme: ThemeId =
    (theme as ThemeId | null) &&
    THEME_PRESETS.some(p => p.id === theme)
      ? (theme as ThemeId)
      : 'nexus';

  _branding = {
    workspaceName: name ?? '',
    workspaceLogo: logo ?? '',
    theme: resolvedTheme,
  };

  applyTheme(resolvedTheme);
  _notify();
  return { ..._branding };
}
