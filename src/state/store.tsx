import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import type { Project, ProjectDraft, ProjectStatus, HealthState } from '../types';
import { listProjects, saveProject, deleteProject, getSetting, setSetting } from '../lib/db';
import { setSecret, deleteSecret, secretKeys } from '../lib/secrets';
import { checkHealth } from '../lib/health';
import { fetchTickets } from '../adapters/tickets';
import { fetchGitInfo } from '../adapters/git';
import { exportProjectBundle, importProjectBundle } from '../lib/bundle';

export interface Nav {
  page: 'dashboard' | 'projects' | 'project' | 'settings';
  projectId?: number;
}

export interface StoreCtx {
  projects: Project[];
  statuses: Record<number, ProjectStatus>;
  nav: Nav;
  setNav(n: Nav): void;
  loading: boolean;
  refreshing: Record<number, boolean>;
  refreshProject(id: number): Promise<void>;
  refreshAll(): Promise<void>;
  saveProjectWithSecrets(
    draft: ProjectDraft,
    secrets: { apiToken?: string; gitToken?: string; loginCreds?: string }
  ): Promise<Project>;
  removeProject(id: number): Promise<void>;
  exportProject(id: number, passphrase: string): Promise<string | null>;
  importProject(passphrase: string): Promise<Project | null>;
  pollIntervalSec: number;
  updatePollInterval(n: number): Promise<void>;
}

const StoreContext = createContext<StoreCtx | null>(null);

const DEFAULT_POLL_INTERVAL = 60;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Record<number, ProjectStatus>>({});
  const [nav, setNav] = useState<Nav>({ page: 'dashboard' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<Record<number, boolean>>({});
  const [pollIntervalSec, setPollIntervalSec] = useState(DEFAULT_POLL_INTERVAL);

  // Track in-flight refreshes to guard concurrent calls
  const refreshInFlight = useRef<Set<number>>(new Set());
  const projectsRef = useRef<Project[]>([]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Load projects + poll interval on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, intervalStr] = await Promise.all([
          listProjects(),
          getSetting('poll_interval_sec'),
        ]);
        if (cancelled) return;
        setProjects(loaded);
        if (intervalStr) {
          const parsed = parseInt(intervalStr, 10);
          if (!isNaN(parsed) && parsed >= 15) setPollIntervalSec(parsed);
        }
        setLoading(false);
        // Initial refresh all after load
        for (const p of loaded) {
          refreshProjectById(p.id, loaded);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-poll
  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => {
      for (const p of projectsRef.current) {
        refreshProjectById(p.id, projectsRef.current);
      }
    }, pollIntervalSec * 1000);
    return () => clearInterval(id);
  }, [loading, pollIntervalSec]);

  const refreshProjectById = useCallback(
    async (id: number, currentProjects?: Project[]) => {
      if (refreshInFlight.current.has(id)) return;
      refreshInFlight.current.add(id);
      setRefreshing(prev => ({ ...prev, [id]: true }));

      const list = currentProjects ?? projectsRef.current;
      const project = list.find(p => p.id === id);
      if (!project) {
        refreshInFlight.current.delete(id);
        setRefreshing(prev => ({ ...prev, [id]: false }));
        return;
      }

      const checkedAt = new Date().toISOString();
      const [healthResult, ticketsResult, gitResult] = await Promise.allSettled([
        checkHealth(project),
        fetchTickets(project),
        fetchGitInfo(project),
      ]);

      let health: HealthState = 'unknown';
      let latencyMs: number | null = null;
      let httpStatus: number | null = null;
      let error: string | null = null;

      if (healthResult.status === 'fulfilled') {
        health = healthResult.value.health;
        latencyMs = healthResult.value.latencyMs;
        httpStatus = healthResult.value.httpStatus;
        error = healthResult.value.error;
      } else {
        error = String(healthResult.reason);
      }

      const tickets = ticketsResult.status === 'fulfilled' ? ticketsResult.value : null;
      const ticketsError =
        ticketsResult.status === 'rejected' ? String(ticketsResult.reason) : null;

      const git = gitResult.status === 'fulfilled' ? gitResult.value : null;
      const gitError = gitResult.status === 'rejected' ? String(gitResult.reason) : null;

      setStatuses(prev => ({
        ...prev,
        [id]: {
          projectId: id,
          health,
          latencyMs,
          httpStatus,
          error,
          checkedAt,
          tickets,
          ticketsError,
          git,
          gitError,
        },
      }));

      refreshInFlight.current.delete(id);
      setRefreshing(prev => ({ ...prev, [id]: false }));
    },
    []
  );

  const refreshProject = useCallback(
    async (id: number) => {
      await refreshProjectById(id);
    },
    [refreshProjectById]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(projectsRef.current.map(p => refreshProjectById(p.id)));
  }, [refreshProjectById]);

  const saveProjectWithSecrets = useCallback(
    async (
      draft: ProjectDraft,
      secrets: { apiToken?: string; gitToken?: string; loginCreds?: string }
    ): Promise<Project> => {
      const saved = await saveProject(draft);

      if (secrets.apiToken) {
        await setSecret(secretKeys.apiToken(saved.id), secrets.apiToken);
      }
      if (secrets.gitToken) {
        await setSecret(secretKeys.gitToken(saved.id), secrets.gitToken);
      }
      if (secrets.loginCreds) {
        await setSecret(secretKeys.loginCreds(saved.id), secrets.loginCreds);
      }

      // Reload projects list
      const updated = await listProjects();
      setProjects(updated);

      // Kick off a refresh for this project
      setTimeout(() => refreshProjectById(saved.id, updated), 0);

      return saved;
    },
    [refreshProjectById]
  );

  const removeProject = useCallback(async (id: number) => {
    await deleteProject(id);
    // Best-effort secret cleanup
    await Promise.allSettled([
      deleteSecret(secretKeys.apiToken(id)),
      deleteSecret(secretKeys.gitToken(id)),
      deleteSecret(secretKeys.loginCreds(id)),
    ]);
    setProjects(prev => prev.filter(p => p.id !== id));
    setStatuses(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const exportProject = useCallback(
    async (id: number, passphrase: string): Promise<string | null> => {
      const project = projectsRef.current.find(p => p.id === id);
      if (!project) return null;
      return exportProjectBundle(project, passphrase);
    },
    []
  );

  const importProject = useCallback(
    async (passphrase: string): Promise<Project | null> => {
      const bundle = await importProjectBundle(passphrase);
      if (!bundle) return null;

      const saved = await saveProject(bundle.project);

      // Write secrets from bundle
      const secretMap = bundle.secrets as Record<string, string>;
      const writes: Promise<void>[] = [];
      if (secretMap['api_token']) {
        writes.push(setSecret(secretKeys.apiToken(saved.id), secretMap['api_token']));
      }
      if (secretMap['git_token']) {
        writes.push(setSecret(secretKeys.gitToken(saved.id), secretMap['git_token']));
      }
      if (secretMap['login_creds']) {
        writes.push(setSecret(secretKeys.loginCreds(saved.id), secretMap['login_creds']));
      }
      await Promise.allSettled(writes);

      const updated = await listProjects();
      setProjects(updated);
      setTimeout(() => refreshProjectById(saved.id, updated), 0);

      return saved;
    },
    [refreshProjectById]
  );

  const updatePollInterval = useCallback(async (n: number) => {
    const clamped = Math.max(15, n);
    setPollIntervalSec(clamped);
    await setSetting('poll_interval_sec', String(clamped));
  }, []);

  const ctx: StoreCtx = {
    projects,
    statuses,
    nav,
    setNav,
    loading,
    refreshing,
    refreshProject,
    refreshAll,
    saveProjectWithSecrets,
    removeProject,
    exportProject,
    importProject,
    pollIntervalSec,
    updatePollInterval,
  };

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
