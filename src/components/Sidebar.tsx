import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import type { Nav } from '../state/store';
import { subscribeBranding } from '../lib/theme';
import type { BrandingState } from '../lib/theme';

interface NavItem {
  page: Nav['page'];
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { page: 'projects', label: 'Projects', icon: '⊞' },
  { page: 'ai', label: 'AI Usage', icon: '◎' },
  { page: 'settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const { nav, setNav } = useStore();
  const activePage = nav.page === 'project' ? 'projects' : nav.page;

  const [branding, setBranding] = useState<BrandingState>({
    workspaceName: '',
    workspaceLogo: '',
    theme: 'nexus',
  });

  useEffect(() => {
    // Subscribe returns an unsubscribe function and immediately delivers current state.
    const unsub = subscribeBranding(state => setBranding(state));
    return unsub;
  }, []);

  const displayName = branding.workspaceName.trim() || 'NEXUS';
  const displaySub  = branding.workspaceName.trim() ? '' : 'Project Control Center';

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        {branding.workspaceLogo ? (
          <img
            className="sidebar__brand-logo"
            src={branding.workspaceLogo}
            alt={displayName}
          />
        ) : null}
        <span className="sidebar__brand-name">{displayName}</span>
        {displaySub && (
          <span className="sidebar__brand-sub">{displaySub}</span>
        )}
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.page}
            className={`sidebar__nav-item${activePage === item.page ? ' sidebar__nav-item--active' : ''}`}
            onClick={() => setNav({ page: item.page })}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            <span className="sidebar__nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__version">0.1.0 · local-first</span>
      </div>
    </aside>
  );
}
