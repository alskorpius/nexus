import { useStore } from '../state/store';
import type { Nav } from '../state/store';

interface NavItem {
  page: Nav['page'];
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { page: 'projects', label: 'Projects', icon: '⊞' },
  { page: 'settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const { nav, setNav } = useStore();

  const activePage = nav.page === 'project' ? 'projects' : nav.page;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-name">NEXUS</span>
        <span className="sidebar__brand-sub">Project Control Center</span>
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
