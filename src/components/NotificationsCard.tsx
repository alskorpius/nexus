import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import {
  listChannels,
  addChannel,
  setChannelEnabled,
  deleteChannel,
  testChannel,
  getNotifyPref,
  setNotifyPref,
} from '../lib/notify';
import type { NotificationChannel, NotifyEvent } from '../lib/notify';
import { ensureOsPermission } from '../adapters/notifiers';
import type { ChannelKind } from '../adapters/notifiers';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestState {
  running: boolean;
  result: string | null; // null = success shown as "Sent", string = error message
  success: boolean;
}

interface DeleteState {
  pending: boolean;
}

// ── Event toggles ─────────────────────────────────────────────────────────────

const EVENTS: NotifyEvent[] = ['incidentOpen', 'incidentClose', 'ssl'];

function EventToggles() {
  const { t } = useI18n();
  const [prefs, setPrefs] = useState<Record<NotifyEvent, boolean>>({
    incidentOpen: true,
    incidentClose: true,
    ssl: true,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all(EVENTS.map(ev => getNotifyPref(ev))).then(([open, close, ssl]) => {
      if (!cancelled) setPrefs({ incidentOpen: open, incidentClose: close, ssl });
    });
    return () => { cancelled = true; };
  }, []);

  async function handleToggle(event: NotifyEvent) {
    const next = !prefs[event];
    setPrefs(prev => ({ ...prev, [event]: next }));
    try {
      await setNotifyPref(event, next);
    } catch (err) {
      // Persistence failed — roll the optimistic update back.
      console.warn('Failed to save notification preference:', err);
      setPrefs(prev => ({ ...prev, [event]: !next }));
    }
  }

  return (
    <div className="form-field">
      <span className="form-label">{t('settings.notifications.events.title')}</span>
      <div className="notify-event-list">
        {EVENTS.map(ev => (
          <label key={ev} className="notify-toggle-row">
            <input
              type="checkbox"
              checked={prefs[ev]}
              onChange={() => handleToggle(ev)}
              className="notify-toggle-checkbox"
            />
            <span className="notify-toggle-label">
              {t(`settings.notifications.events.${ev}`)}
            </span>
          </label>
        ))}
      </div>
      <p className="form-hint form-hint--block">
        {t('settings.notifications.events.hint')}
      </p>
    </div>
  );
}

// ── Channel row ───────────────────────────────────────────────────────────────

interface ChannelRowProps {
  channel: NotificationChannel;
  onEnabledChange: (id: number, enabled: boolean) => void;
  onDeleted: (id: number) => void;
}

function ChannelRow({ channel, onEnabledChange, onDeleted }: ChannelRowProps) {
  const { t } = useI18n();
  const [testState, setTestState] = useState<TestState>({
    running: false,
    result: null,
    success: false,
  });
  const [deleteState, setDeleteState] = useState<DeleteState>({ pending: false });

  // Clear the "Sent" auto-hide timer if the row unmounts.
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current);
  }, []);

  function kindLabel(kind: ChannelKind): string {
    return t(`settings.notifications.channel.kind.${kind}`);
  }

  async function handleTest() {
    setTestState({ running: true, result: null, success: false });
    const err = await testChannel(channel);
    if (err === null) {
      setTestState({ running: false, result: null, success: true });
      successTimer.current = setTimeout(
        () => setTestState(prev => ({ ...prev, success: false })),
        3000,
      );
    } else {
      setTestState({ running: false, result: err, success: false });
    }
  }

  async function handleDeleteConfirm() {
    await deleteChannel(channel.id);
    onDeleted(channel.id);
  }

  return (
    <div className="notify-channel-row">
      <label className="notify-channel-enable" title={t('settings.notifications.channel.enable')}>
        <input
          type="checkbox"
          checked={channel.enabled}
          onChange={e => onEnabledChange(channel.id, e.target.checked)}
          className="notify-toggle-checkbox"
        />
      </label>

      <div className="notify-channel-info">
        <span className="notify-channel-name">{channel.name}</span>
        <span className="notify-channel-kind badge badge--muted">{kindLabel(channel.kind)}</span>
      </div>

      <div className="notify-channel-actions">
        {testState.success && (
          <span className="settings-saved">{t('settings.notifications.channel.testSent')}</span>
        )}
        {testState.result && !testState.success && (
          <span
            className="notify-test-error"
            title={testState.result}
          >
            {testState.result.length > 60
              ? testState.result.slice(0, 60) + '…'
              : testState.result}
          </span>
        )}

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={testState.running}
          onClick={handleTest}
        >
          {testState.running ? '…' : t('settings.notifications.channel.test')}
        </button>

        {deleteState.pending ? (
          <>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={handleDeleteConfirm}
            >
              {t('settings.notifications.channel.deleteConfirm')}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setDeleteState({ pending: false })}
            >
              {t('settings.notifications.channel.deleteCancel')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => setDeleteState({ pending: true })}
          >
            {t('settings.notifications.channel.delete')}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add channel form ──────────────────────────────────────────────────────────

interface AddFormProps {
  onAdded: (channel: NotificationChannel) => void;
}

function AddChannelForm({ onAdded }: AddFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ChannelKind>('os');
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [webhook, setWebhook] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('settings.notifications.add.error.name');
    if (kind === 'telegram') {
      if (!token.trim()) errs.token = t('settings.notifications.add.error.token');
      if (!chatId.trim()) errs.chatId = t('settings.notifications.add.error.chatId');
    }
    if (kind === 'slack' || kind === 'discord') {
      const url = webhook.trim();
      if (!url) {
        errs.webhook = t('settings.notifications.add.error.webhook');
      } else if (!url.toLowerCase().startsWith('https://')) {
        // The webhook URL is itself the secret — never allow plaintext http.
        errs.webhook = t('settings.notifications.add.error.webhookHttps');
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const config = kind === 'telegram' ? { chatId: chatId.trim() } : {};
      let secret: string | null = null;
      if (kind === 'telegram') secret = token.trim();
      else if (kind === 'slack' || kind === 'discord') secret = webhook.trim();

      const channel = await addChannel({ name: name.trim(), kind, config }, secret);
      onAdded(channel);

      // Adding an OS channel is a user gesture — the right moment to ask for
      // the system permission, instead of a surprise prompt during polling.
      if (kind === 'os') {
        ensureOsPermission().catch(() => {});
      }

      // Reset form
      setName('');
      setKind('os');
      setToken('');
      setChatId('');
      setWebhook('');
      setErrors({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrors({ submit: `${t('settings.notifications.add.error.failed')} ${msg}` });
    } finally {
      setSubmitting(false);
    }
  }

  function getHint(): string | null {
    if (kind === 'telegram') return t('settings.notifications.add.hint.telegram');
    if (kind === 'slack') return t('settings.notifications.add.hint.slack');
    if (kind === 'discord') return t('settings.notifications.add.hint.discord');
    return null;
  }

  const hint = getHint();

  return (
    <form onSubmit={handleSubmit} className="notify-add-form">
      <div className="form-section__legend">{t('settings.notifications.add.title')}</div>

      {/* Name */}
      <div className="form-field">
        <label className="form-label" htmlFor="notify-name">
          {t('settings.notifications.add.name.label')}
          <span className="form-required" aria-hidden="true">*</span>
        </label>
        <input
          id="notify-name"
          type="text"
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          value={name}
          placeholder={t('settings.notifications.add.name.placeholder')}
          onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      {/* Kind */}
      <div className="form-field">
        <label className="form-label" htmlFor="notify-kind">
          {t('settings.notifications.add.kind.label')}
        </label>
        <select
          id="notify-kind"
          className="form-input form-select"
          style={{ maxWidth: '260px' }}
          value={kind}
          onChange={e => { setKind(e.target.value as ChannelKind); setErrors({}); }}
        >
          <option value="os">{t('settings.notifications.channel.kind.os')}</option>
          <option value="telegram">Telegram</option>
          <option value="slack">Slack</option>
          <option value="discord">Discord</option>
        </select>
      </div>

      {/* OS hint */}
      {kind === 'os' && (
        <p className="form-hint form-hint--block" style={{ marginTop: '-8px', marginBottom: '12px' }}>
          {t('settings.notifications.add.os.hint')}
        </p>
      )}

      {/* Telegram fields */}
      {kind === 'telegram' && (
        <>
          <div className="form-field">
            <label className="form-label" htmlFor="notify-token">
              {t('settings.notifications.add.token.label')}
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="notify-token"
              type="password"
              className={`form-input${errors.token ? ' form-input--error' : ''}`}
              value={token}
              placeholder={t('settings.notifications.add.token.placeholder')}
              autoComplete="off"
              onChange={e => { setToken(e.target.value); setErrors(prev => ({ ...prev, token: '' })); }}
            />
            {errors.token && <p className="form-error">{errors.token}</p>}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="notify-chatid">
              {t('settings.notifications.add.chatId.label')}
              <span className="form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="notify-chatid"
              type="text"
              className={`form-input${errors.chatId ? ' form-input--error' : ''}`}
              value={chatId}
              placeholder={t('settings.notifications.add.chatId.placeholder')}
              onChange={e => { setChatId(e.target.value); setErrors(prev => ({ ...prev, chatId: '' })); }}
            />
            {errors.chatId && <p className="form-error">{errors.chatId}</p>}
          </div>
        </>
      )}

      {/* Slack / Discord webhook */}
      {(kind === 'slack' || kind === 'discord') && (
        <div className="form-field">
          <label className="form-label" htmlFor="notify-webhook">
            {t('settings.notifications.add.webhook.label')}
            <span className="form-required" aria-hidden="true">*</span>
          </label>
          <input
            id="notify-webhook"
            type="password"
            className={`form-input${errors.webhook ? ' form-input--error' : ''}`}
            value={webhook}
            placeholder={t('settings.notifications.add.webhook.placeholder')}
            autoComplete="off"
            onChange={e => { setWebhook(e.target.value); setErrors(prev => ({ ...prev, webhook: '' })); }}
          />
          {errors.webhook && <p className="form-error">{errors.webhook}</p>}
        </div>
      )}

      {hint && (
        <p className="form-hint form-hint--block" style={{ marginBottom: '12px' }}>
          {hint}
        </p>
      )}

      <p className="form-hint form-hint--block" style={{ marginBottom: '12px' }}>
        {t('settings.notifications.add.hint.keyring')}
      </p>

      {errors.submit && <p className="form-error">{errors.submit}</p>}

      <button
        type="submit"
        className="btn btn--primary"
        disabled={submitting}
      >
        {t('settings.notifications.add.submit')}
      </button>
    </form>
  );
}

// ── NotificationsCard ─────────────────────────────────────────────────────────

export function NotificationsCard() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<NotificationChannel[]>([]);

  useEffect(() => {
    let cancelled = false;
    listChannels().then(loaded => {
      if (!cancelled) setChannels(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleEnabledChange(id: number, enabled: boolean) {
    setChannels(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, enabled } : ch)),
    );
    try {
      await setChannelEnabled(id, enabled);
    } catch (err) {
      // Persistence failed — roll the optimistic update back.
      console.warn('Failed to toggle channel:', err);
      setChannels(prev =>
        prev.map(ch => (ch.id === id ? { ...ch, enabled: !enabled } : ch)),
      );
    }
  }

  function handleDeleted(id: number) {
    setChannels(prev => prev.filter(ch => ch.id !== id));
  }

  function handleAdded(channel: NotificationChannel) {
    setChannels(prev => [...prev, channel]);
  }

  return (
    <div className="card settings-card">
      <h2 className="settings-card__title">{t('settings.notifications.title')}</h2>

      <EventToggles />

      {/* Channel list */}
      <div className="form-field">
        {channels.length === 0 ? (
          <p className="notify-empty">{t('settings.notifications.channels.empty')}</p>
        ) : (
          <div className="notify-channel-list">
            {channels.map(ch => (
              <ChannelRow
                key={ch.id}
                channel={ch}
                onEnabledChange={handleEnabledChange}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>

      <AddChannelForm onAdded={handleAdded} />
    </div>
  );
}
