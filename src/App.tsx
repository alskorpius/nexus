import { useEffect } from 'react';
import { StoreProvider, useStore } from './state/store';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Settings } from './pages/Settings';
import { AiUsage } from './pages/AiUsage';
import { Digest } from './pages/Digest';
import { loadBranding } from './lib/theme';
import { loadLanguage, useI18n } from './lib/i18n';

function AppContent() {
  const { nav, loading } = useStore();
  const { t } = useI18n();

  useEffect(() => {
    // Load persisted theme + branding + language on mount; fire-and-forget.
    loadBranding().catch(err => console.warn('Failed to load branding:', err));
    loadLanguage().catch(err => console.warn('Failed to load language:', err));
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          letterSpacing: '0.05em',
        }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        {nav.page === 'dashboard' && <Dashboard />}
        {nav.page === 'projects' && <Projects />}
        {nav.page === 'project' && nav.projectId != null && (
          <ProjectDetail projectId={nav.projectId} />
        )}
        {nav.page === 'settings' && <Settings />}
        {nav.page === 'ai' && <AiUsage />}
        {nav.page === 'digest' && <Digest />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
