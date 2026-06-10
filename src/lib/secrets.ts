import { invoke } from '@tauri-apps/api/core';

export async function getSecret(key: string): Promise<string | null> {
  return invoke<string | null>('secret_get', { key });
}

export async function setSecret(key: string, value: string): Promise<void> {
  return invoke<void>('secret_set', { key, value });
}

export async function deleteSecret(key: string): Promise<void> {
  return invoke<void>('secret_delete', { key });
}

export const secretKeys = {
  apiToken: (id: number) => `project:${id}:api_token`,
  gitToken: (id: number) => `project:${id}:git_token`,
  loginCreds: (id: number) => `project:${id}:login_creds`,
  aiAdminKey: (accountId: number) => `ai:${accountId}:admin_key`,
  notifySecret: (channelId: number) => `notify:${channelId}:secret`,
};
