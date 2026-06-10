import { httpRequest } from '../lib/http';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export type ChannelKind = 'os' | 'telegram' | 'slack' | 'discord';

/**
 * Non-secret per-channel config stored in SQLite (JSON).
 * Secrets (bot token / webhook URL) live in the OS keyring.
 */
export interface ChannelConfig {
  /** Telegram only: target chat id (number or @channelname). */
  chatId?: string;
}

// Keep bodies under every provider's message limit (Telegram 4096,
// Slack/Discord ~4000) with headroom for the title.
const MAX_BODY_CHARS = 3000;

/**
 * Deliver one message through a channel. Throws with a human-readable,
 * secret-redacted message on failure (surfaced by the Test button and
 * logged by dispatch). `interactive` allows the OS permission prompt —
 * pass true only from a user gesture (Test button), never from polling.
 */
export async function sendToChannel(
  kind: ChannelKind,
  secret: string | null,
  config: ChannelConfig,
  title: string,
  body: string,
  interactive = false,
): Promise<void> {
  const safeBody = body.length > MAX_BODY_CHARS ? body.slice(0, MAX_BODY_CHARS) + '…' : body;
  switch (kind) {
    case 'os':
      return sendOs(title, safeBody, interactive);
    case 'telegram':
      return sendTelegram(secret, config, title, safeBody);
    case 'slack':
      return sendSlack(secret, title, safeBody);
    case 'discord':
      return sendDiscord(secret, title, safeBody);
  }
}

/**
 * Ask for OS notification permission. Call from a user gesture (adding an
 * OS channel, Test button) so the system prompt never appears spontaneously.
 */
export async function ensureOsPermission(): Promise<boolean> {
  if (await isPermissionGranted()) return true;
  return (await requestPermission()) === 'granted';
}

/** Replace secret substrings in an error message before rethrowing. */
function redacted(err: unknown, secrets: Array<string | null>): Error {
  let msg = err instanceof Error ? err.message : String(err);
  for (const s of secrets) {
    if (s) msg = msg.split(s).join('***');
  }
  return new Error(msg);
}

async function sendOs(title: string, body: string, interactive: boolean): Promise<void> {
  const granted = interactive ? await ensureOsPermission() : await isPermissionGranted();
  if (!granted) throw new Error('OS notification permission not granted');
  sendNotification({ title, body });
}

async function sendTelegram(
  token: string | null,
  config: ChannelConfig,
  title: string,
  body: string,
): Promise<void> {
  if (!token) throw new Error('Telegram bot token is missing');
  const chatId = (config.chatId ?? '').trim();
  if (!chatId) throw new Error('Telegram chat id is missing');

  try {
    const response = await httpRequest({
      method: 'POST',
      url: `https://api.telegram.org/bot${token}/sendMessage`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `${title}\n${body}` }),
      timeoutMs: 10000,
    });
    if (!response.ok) {
      throw new Error(`Telegram API ${response.status}: ${response.body.slice(0, 200)}`);
    }
  } catch (err) {
    throw redacted(err, [token]);
  }
}

async function sendSlack(
  webhookUrl: string | null,
  title: string,
  body: string,
): Promise<void> {
  if (!webhookUrl) throw new Error('Slack webhook URL is missing');
  try {
    const response = await httpRequest({
      method: 'POST',
      url: webhookUrl,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `*${title}*\n${body}` }),
      timeoutMs: 10000,
    });
    if (!response.ok) {
      throw new Error(`Slack webhook ${response.status}: ${response.body.slice(0, 200)}`);
    }
  } catch (err) {
    throw redacted(err, [webhookUrl]);
  }
}

async function sendDiscord(
  webhookUrl: string | null,
  title: string,
  body: string,
): Promise<void> {
  if (!webhookUrl) throw new Error('Discord webhook URL is missing');
  try {
    const response = await httpRequest({
      method: 'POST',
      url: webhookUrl,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `**${title}**\n${body}` }),
      timeoutMs: 10000,
    });
    if (!response.ok) {
      throw new Error(`Discord webhook ${response.status}: ${response.body.slice(0, 200)}`);
    }
  } catch (err) {
    throw redacted(err, [webhookUrl]);
  }
}
