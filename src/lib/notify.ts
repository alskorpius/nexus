import { getDb, getSetting, setSetting } from './db';
import { getSecret, setSecret, deleteSecret, secretKeys } from './secrets';
import { sendToChannel } from '../adapters/notifiers';
import type { ChannelKind, ChannelConfig } from '../adapters/notifiers';
import type { IncidentTransition } from './history';
import type { SslInfo } from '../types';
import { t } from './i18n';

// ── Channel model ────────────────────────────────────────────────────────────

export interface NotificationChannel {
  id: number;
  name: string;
  kind: ChannelKind;
  enabled: boolean;
  config: ChannelConfig;
  createdAt: string;
}

interface ChannelRow {
  id: number;
  name: string;
  kind: string;
  enabled: number;
  config: string;
  created_at: string;
}

function mapChannel(row: ChannelRow): NotificationChannel {
  let config: ChannelConfig = {};
  try {
    config = JSON.parse(row.config) as ChannelConfig;
  } catch {
    // Malformed config — treat as empty rather than break the page.
  }
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as ChannelKind,
    enabled: row.enabled === 1,
    config,
    createdAt: row.created_at,
  };
}

// ── Channel CRUD ─────────────────────────────────────────────────────────────

export async function listChannels(): Promise<NotificationChannel[]> {
  const db = await getDb();
  const rows = await db.select<ChannelRow[]>(
    'SELECT * FROM notification_channels ORDER BY name',
  );
  return rows.map(mapChannel);
}

export async function addChannel(
  draft: { name: string; kind: ChannelKind; config: ChannelConfig },
  secret: string | null,
): Promise<NotificationChannel> {
  const db = await getDb();
  const result = await db.execute(
    'INSERT INTO notification_channels (name, kind, config) VALUES ($1, $2, $3)',
    [draft.name, draft.kind, JSON.stringify(draft.config)],
  );
  const id = result.lastInsertId as number;
  if (!id) throw new Error('Failed to insert channel (no id returned)');
  if (secret) {
    try {
      await setSecret(secretKeys.notifySecret(id), secret);
    } catch (err) {
      // Don't leave a secretless orphan row behind.
      await db
        .execute('DELETE FROM notification_channels WHERE id = $1', [id])
        .catch(() => {});
      throw err;
    }
  }
  const rows = await db.select<ChannelRow[]>(
    'SELECT * FROM notification_channels WHERE id = $1',
    [id],
  );
  if (rows.length === 0) throw new Error('Failed to retrieve newly inserted channel');
  return mapChannel(rows[0]);
}

export async function setChannelEnabled(id: number, enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE notification_channels SET enabled = $1 WHERE id = $2', [
    enabled ? 1 : 0,
    id,
  ]);
}

export async function deleteChannel(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM notification_channels WHERE id = $1', [id]);
  await deleteSecret(secretKeys.notifySecret(id)).catch(() => {});
}

// ── Event preferences ────────────────────────────────────────────────────────

export type NotifyEvent = 'incidentOpen' | 'incidentClose' | 'ssl';

const PREF_KEYS: Record<NotifyEvent, string> = {
  incidentOpen: 'notify_incident_open',
  incidentClose: 'notify_incident_close',
  ssl: 'notify_ssl',
};

/** All events default to enabled. */
export async function getNotifyPref(event: NotifyEvent): Promise<boolean> {
  const raw = await getSetting(PREF_KEYS[event]);
  return raw !== '0';
}

export async function setNotifyPref(event: NotifyEvent, on: boolean): Promise<void> {
  await setSetting(PREF_KEYS[event], on ? '1' : '0');
}

// ── Dispatch ─────────────────────────────────────────────────────────────────

/**
 * Send a message to every enabled channel. Failures are logged per channel
 * and never thrown — notifications must not break polling.
 */
export async function dispatch(event: NotifyEvent, title: string, body: string): Promise<void> {
  if (!(await getNotifyPref(event))) return;

  const channels = (await listChannels()).filter(c => c.enabled);
  if (channels.length === 0) return;

  await Promise.allSettled(
    channels.map(async channel => {
      try {
        const secret =
          channel.kind === 'os' ? null : await getSecret(secretKeys.notifySecret(channel.id));
        await sendToChannel(channel.kind, secret, channel.config, title, body);
      } catch (err) {
        console.warn(`Notification via "${channel.name}" (${channel.kind}) failed:`, err);
      }
    }),
  );
}

/** Used by the Test button. Returns null on success, error message on failure. */
export async function testChannel(channel: NotificationChannel): Promise<string | null> {
  try {
    const secret =
      channel.kind === 'os' ? null : await getSecret(secretKeys.notifySecret(channel.id));
    await sendToChannel(
      channel.kind,
      secret,
      channel.config,
      t('notify.test.title'),
      t('notify.test.body'),
      true, // user gesture — OS permission prompt allowed
    );
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

// ── Event-specific helpers (called from the store) ───────────────────────────

export async function notifyIncidentTransition(
  projectName: string,
  transition: IncidentTransition,
): Promise<void> {
  if (!transition) return;

  if (transition.kind === 'opened') {
    const severity = t(`common.health.${transition.severity}`);
    await dispatch(
      'incidentOpen',
      t('notify.incident.openedTitle', { project: projectName }),
      transition.error
        ? t('notify.incident.openedBodyError', { severity, error: transition.error })
        : t('notify.incident.openedBody', { severity }),
    );
    return;
  }

  const minutes = Math.max(1, Math.round(transition.durationMs / 60000));
  await dispatch(
    'incidentClose',
    t('notify.incident.closedTitle', { project: projectName }),
    t('notify.incident.closedBody', { minutes }),
  );
}

// SSL expiry thresholds (days), checked from largest to smallest.
const SSL_THRESHOLDS = [30, 15, 7];

interface SslNotifiedState {
  expiresAt: string;
  threshold: number;
}

/**
 * Notify when a certificate crosses a 30/15/7-day threshold, at most once per
 * (certificate, threshold) — state is kept in app_settings so renewing the
 * cert (new expiresAt) resets the dedupe.
 */
export async function maybeNotifySsl(
  projectId: number,
  projectName: string,
  ssl: SslInfo | null,
): Promise<void> {
  if (!ssl || ssl.daysLeft === null || ssl.expiresAt === null) return;

  const crossed = SSL_THRESHOLDS.filter(th => ssl.daysLeft as number <= th).pop();
  if (crossed === undefined) return;

  const stateKey = `ssl_notified_${projectId}`;
  const rawState = await getSetting(stateKey);
  if (rawState) {
    try {
      const prev = JSON.parse(rawState) as SslNotifiedState;
      // Same cert and an equal-or-lower threshold already announced → skip.
      if (prev.expiresAt === ssl.expiresAt && prev.threshold <= crossed) return;
    } catch {
      // Malformed state — fall through and re-notify.
    }
  }

  await dispatch(
    'ssl',
    t('notify.ssl.title', { project: projectName }),
    t('notify.ssl.body', { host: ssl.host, days: ssl.daysLeft }),
  );
  await setSetting(stateKey, JSON.stringify({ expiresAt: ssl.expiresAt, threshold: crossed }));
}
