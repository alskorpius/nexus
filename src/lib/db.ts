import Database from '@tauri-apps/plugin-sql';
import type { Project, ProjectDraft } from '../types';

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load('sqlite:nexus.db');
  }
  return _db;
}

interface ProjectRow {
  id: number;
  name: string;
  description: string;
  api_base_url: string;
  auth_method: string;
  login_endpoint: string;
  token_field: string;
  git_provider: string;
  repo_url: string;
  git_project_id: string;
  support_endpoint: string;
  health_endpoint: string;
  deploy_endpoint: string;
  docs_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    apiBaseUrl: row.api_base_url,
    authMethod: row.auth_method as Project['authMethod'],
    loginEndpoint: row.login_endpoint,
    tokenField: row.token_field,
    gitProvider: row.git_provider as Project['gitProvider'],
    repoUrl: row.repo_url,
    gitProjectId: row.git_project_id,
    supportEndpoint: row.support_endpoint,
    healthEndpoint: row.health_endpoint,
    deployEndpoint: row.deploy_endpoint,
    docsUrl: row.docs_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    'SELECT * FROM projects ORDER BY name',
  );
  return rows.map(mapRow);
}

export async function getProject(id: number): Promise<Project | null> {
  const db = await getDb();
  const rows = await db.select<ProjectRow[]>(
    'SELECT * FROM projects WHERE id = $1',
    [id],
  );
  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function saveProject(draft: ProjectDraft): Promise<Project> {
  const db = await getDb();

  if (draft.id === undefined) {
    const result = await db.execute(
      `INSERT INTO projects
        (name, description, api_base_url, auth_method, login_endpoint, token_field,
         git_provider, repo_url, git_project_id,
         support_endpoint, health_endpoint, deploy_endpoint, docs_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        draft.name,
        draft.description,
        draft.apiBaseUrl,
        draft.authMethod,
        draft.loginEndpoint,
        draft.tokenField,
        draft.gitProvider,
        draft.repoUrl,
        draft.gitProjectId,
        draft.supportEndpoint,
        draft.healthEndpoint,
        draft.deployEndpoint,
        draft.docsUrl,
        draft.notes,
      ],
    );
    const saved = await getProject(result.lastInsertId as number);
    if (!saved) throw new Error('Failed to retrieve newly inserted project');
    return saved;
  } else {
    await db.execute(
      `UPDATE projects SET
        name = $1, description = $2, api_base_url = $3, auth_method = $4,
        login_endpoint = $5, token_field = $6,
        git_provider = $7, repo_url = $8, git_project_id = $9,
        support_endpoint = $10, health_endpoint = $11, deploy_endpoint = $12,
        docs_url = $13, notes = $14, updated_at = datetime('now')
       WHERE id = $15`,
      [
        draft.name,
        draft.description,
        draft.apiBaseUrl,
        draft.authMethod,
        draft.loginEndpoint,
        draft.tokenField,
        draft.gitProvider,
        draft.repoUrl,
        draft.gitProjectId,
        draft.supportEndpoint,
        draft.healthEndpoint,
        draft.deployEndpoint,
        draft.docsUrl,
        draft.notes,
        draft.id,
      ],
    );
    const saved = await getProject(draft.id);
    if (!saved) throw new Error('Failed to retrieve updated project');
    return saved;
  }
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM projects WHERE id = $1', [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<Array<{ value: string }>>(
    'SELECT value FROM app_settings WHERE key = $1',
    [key],
  );
  if (rows.length === 0) return null;
  return rows[0].value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES ($1, $2)',
    [key, value],
  );
}
