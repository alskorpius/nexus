import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import type { Project, ProjectDraft } from '../types';
import { getSecret, secretKeys } from './secrets';

const DIALOG_FILTERS = [{ name: 'Nexus Project', extensions: ['nexusproj'] }];

export interface ImportedBundle {
  project: ProjectDraft;
  secrets: Record<string, string>;
}

interface BundlePayload {
  version: number;
  kind: string;
  project: ProjectDraft;
  secrets: Record<string, string>;
}

export async function exportProjectBundle(
  project: Project,
  passphrase: string,
): Promise<string | null> {
  const [apiToken, gitToken, loginCreds] = await Promise.all([
    getSecret(secretKeys.apiToken(project.id)),
    getSecret(secretKeys.gitToken(project.id)),
    getSecret(secretKeys.loginCreds(project.id)),
  ]);

  const secrets: Record<string, string> = {};
  if (apiToken) secrets['api_token'] = apiToken;
  if (gitToken) secrets['git_token'] = gitToken;
  if (loginCreds) secrets['login_creds'] = loginCreds;

  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...projectDraft } = project;
  void _id; void _createdAt; void _updatedAt;

  const payload: BundlePayload = {
    version: 1,
    kind: 'nexus-project',
    project: projectDraft,
    secrets,
  };

  const plaintext = JSON.stringify(payload);

  const path = await save({
    defaultPath: `${project.name}.nexusproj`,
    filters: DIALOG_FILTERS,
  });

  if (path === null) return null;

  await invoke<void>('export_bundle', { path, plaintext, passphrase });
  return path;
}

export async function importProjectBundle(
  passphrase: string,
): Promise<ImportedBundle | null> {
  const path = await open({
    multiple: false,
    filters: DIALOG_FILTERS,
  });

  if (path === null) return null;

  let plaintext: string;
  try {
    plaintext = await invoke<string>('import_bundle', { path, passphrase });
  } catch (e: unknown) {
    const msg = typeof e === 'string' ? e : e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to decrypt bundle: ${msg}`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(plaintext);
  } catch {
    throw new Error('Bundle file is corrupt: invalid JSON');
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    (payload as BundlePayload).kind !== 'nexus-project'
  ) {
    throw new Error('Invalid bundle: unexpected format');
  }

  const bundle = payload as BundlePayload;
  return {
    project: bundle.project,
    secrets: bundle.secrets ?? {},
  };
}
