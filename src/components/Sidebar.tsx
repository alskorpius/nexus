import { useEffect, useState } from 'react';
import { useStore } from '../state/store';
import type { Nav } from '../state/store';
import { subscribeBranding } from '../lib/theme';
import type { BrandingState } from '../lib/theme';
import { useI18n } from '../lib/i18n';

interface NavItem {
  page: Nav['page'];
  labelKey: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', labelKey: 'dashboard.nav.dashboard', icon: '⬡' },
  { page: 'projects',  labelKey: 'dashboard.nav.projects',  icon: '⊞' },
  { page: 'digest',    labelKey: 'dashboard.nav.digest',    icon: '≣' },
  { page: 'ai',        labelKey: 'dashboard.nav.ai',        icon: '◎' },
  { page: 'settings',  labelKey: 'dashboard.nav.settings',  icon: '⚙' },
];

export function Sidebar() {
  const { nav, setNav } = useStore();
  const { t } = useI18n();
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
  const displaySub  = branding.workspaceName.trim() ? '' : t('dashboard.nav.subBrand');

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
            <span className="sidebar__nav-label">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__version">0.1.0 · local-first</span>
      </div>
    </aside>
  );
}
