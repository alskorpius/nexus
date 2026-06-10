import { useEffect } from 'react';
import { StoreProvider, useStore } from './state/store';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Settings } from './pages/Settings';
import { AiUsage } from './pages/AiUsage';
import { loadBranding } from './lib/theme';

function AppContent() {
  const { nav, loading } = useStore();

  useEffect(() => {
    // Load persisted theme + branding on mount; fire-and-forget.
    loadBranding().catch(err => console.warn('Failed to load branding:', err));
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
          Loading…
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
