import { useState, useEffect, useCallback, useRef } from 'react';
import type { AiAccount } from '../lib/db';
import { listAiAccounts, saveAiAccount, deleteAiAccount } from '../lib/db';
import { getSecret, setSecret, deleteSecret, secretKeys } from '../lib/secrets';
import { fetchAiUsage } from '../adapters/ai';
import type { AiUsageSummary } from '../adapters/ai';

// ---------------------------------------------------------------------------
// Module-level in-flight promise registry — dedupes concurrent fetches for
// the same account id so a "Refresh all" mid-flight doesn't double-fetch.
// ---------------------------------------------------------------------------
const inFlight = new Map<number, Promise<AiUsageSummary>>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.01) return '<$0.01';
  return `$${usd.toFixed(2)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Mini bar chart (inline divs, no libs)
// The bar height represents total tokens: uncached input + cache read +
// cache creation + output.
// ---------------------------------------------------------------------------

function DailyBarChart({ days }: { days: AiUsageSummary['days'] }) {
  if (days.length === 0) return null;
  const maxTokens = Math.max(
    ...days.map((d) => d.inputTokens + d.cacheReadTokens + d.cacheCreationTokens + d.outputTokens),
    1,
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40, marginTop: 8 }}>
      {days.map((d) => {
        const total = d.inputTokens + d.cacheReadTokens + d.cacheCreationTokens + d.outputTokens;
        const pct = (total / maxTokens) * 100;
        const isToday = d.date === todayStr();
        return (
          <div
            key={d.date}
            title={`${d.date}: ${fmtTokens(total)} tokens (in: ${fmtTokens(d.inputTokens)}, cache-read: ${fmtTokens(d.cacheReadTokens)}, cache-write: ${fmtTokens(d.cacheCreationTokens)}, out: ${fmtTokens(d.outputTokens)})`}
            style={{
              flex: 1,
              height: `${Math.max(pct, 2)}%`,
              backgroundColor: isToday ? 'var(--accent, #4f8ef7)' : 'var(--border, #3a3a4a)',
              borderRadius: 2,
              minWidth: 2,
              cursor: 'default',
              transition: 'background-color 0.15s',
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider badge
// ---------------------------------------------------------------------------

function ProviderBadge({ provider }: { provider: AiAccount['provider'] }) {
  const label = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
  const bg = provider === 'anthropic' ? '#d97706' : '#16a34a';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Account card
// ---------------------------------------------------------------------------

interface AccountCardProps {
  account: AiAccount;
  summary: AiUsageSummary | null;
  loading: boolean;
  onRefresh: (id: number) => void;
  onDelete: (id: number) => void;
}

function AccountCard({ account, summary, loading, onRefresh, onDelete }: AccountCardProps) {
  const today = summary?.days.find((d) => d.date === todayStr());
  const todayTotal = today
    ? today.inputTokens + today.cacheReadTokens + today.cacheCreationTokens + today.outputTokens
    : null;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProviderBadge provider={account.provider} />
          <span style={{ fontWeight: 600 }}>{account.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn"
            disabled={loading}
            onClick={() => onRefresh(account.id)}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button
            className="btn"
            onClick={() => onDelete(account.id)}
            style={{ fontSize: 12, padding: '4px 10px', color: 'var(--error, #ef4444)' }}
          >
            Delete
          </button>
        </div>
      </div>

      {summary?.error && (
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--error, #ef4444)' }}>
          {summary.error}
        </p>
      )}

      {summary && !summary.error && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
              marginTop: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                Input tokens (uncached, 30d)
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmtTokens(summary.totalInput)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                Output tokens (30d)
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmtTokens(summary.totalOutput)}</div>
            </div>
            {summary.totalCacheRead > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  Cache read tokens (30d)
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {fmtTokens(summary.totalCacheRead)}
                </div>
              </div>
            )}
            {summary.totalCacheCreation > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  Cache write tokens (30d)
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {fmtTokens(summary.totalCacheCreation)}
                </div>
              </div>
            )}
            {summary.totalCostUsd !== null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  Cost (30d)
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {fmtCost(summary.totalCostUsd)}
                </div>
              </div>
            )}
            {todayTotal !== null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  Today's tokens
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{fmtTokens(todayTotal)}</div>
              </div>
            )}
          </div>

          {summary.days.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                Daily token usage (last 30 days)
              </div>
              <DailyBarChart days={summary.days} />
            </div>
          )}
        </>
      )}

      {!summary && !loading && (
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          No admin key stored. Add one below or save the account again with a key.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AiUsage() {
  const [accounts, setAccounts] = useState<AiAccount[]>([]);
  const [summaries, setSummaries] = useState<Map<number, AiUsageSummary>>(new Map());
  const [loading, setLoading] = useState<Set<number>>(new Set());

  // Mounted guard — prevents setState after unmount
  const mountedRef = useRef(true);

  // Add-account form state
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<'anthropic' | 'openai'>('anthropic');
  const [formKey, setFormKey] = useState('');
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Load accounts on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;
    void loadAccounts();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function loadAccounts() {
    const list = await listAiAccounts();
    if (!mountedRef.current) return;
    setAccounts(list);
    // Auto-fetch usage for all accounts that have a stored key
    for (const acct of list) {
      const key = await getSecret(secretKeys.aiAdminKey(acct.id));
      if (key) void fetchUsageForAccount(acct, key);
    }
  }

  // ---------------------------------------------------------------------------
  // Fetch usage — deduped per account id
  // ---------------------------------------------------------------------------

  const fetchUsageForAccount = useCallback(async (acct: AiAccount, adminKey: string) => {
    // If there is already an in-flight request for this account, reuse it
    const existing = inFlight.get(acct.id);
    if (existing) {
      // Still mark loading so the button shows the right state
      if (mountedRef.current) {
        setLoading((prev) => new Set(prev).add(acct.id));
      }
      const summary = await existing.catch((e: unknown) => ({
        days: [] as AiUsageSummary['days'],
        totalInput: 0,
        totalOutput: 0,
        totalCacheRead: 0,
        totalCacheCreation: 0,
        totalCostUsd: null as null,
        error: String(e),
      }));
      if (mountedRef.current) {
        setSummaries((prev) => new Map(prev).set(acct.id, summary));
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(acct.id);
          return next;
        });
      }
      return;
    }

    if (mountedRef.current) {
      setLoading((prev) => new Set(prev).add(acct.id));
    }

    const promise = fetchAiUsage(acct, adminKey);
    inFlight.set(acct.id, promise);

    let summary: AiUsageSummary;
    try {
      summary = await promise;
    } catch (e) {
      summary = {
        days: [],
        totalInput: 0,
        totalOutput: 0,
        totalCacheRead: 0,
        totalCacheCreation: 0,
        totalCostUsd: null,
        error: String(e),
      };
    } finally {
      inFlight.delete(acct.id);
    }

    if (mountedRef.current) {
      setSummaries((prev) => new Map(prev).set(acct.id, summary));
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(acct.id);
        return next;
      });
    }
  }, []);

  async function handleRefresh(id: number) {
    const acct = accounts.find((a) => a.id === id);
    if (!acct) return;
    const key = await getSecret(secretKeys.aiAdminKey(id));
    if (!key) {
      if (mountedRef.current) {
        setSummaries((prev) =>
          new Map(prev).set(id, {
            days: [],
            totalInput: 0,
            totalOutput: 0,
            totalCacheRead: 0,
            totalCacheCreation: 0,
            totalCostUsd: null,
            error: 'No admin key stored for this account.',
          }),
        );
      }
      return;
    }
    void fetchUsageForAccount(acct, key);
  }

  async function handleRefreshAll() {
    for (const acct of accounts) {
      const key = await getSecret(secretKeys.aiAdminKey(acct.id));
      if (key) void fetchUsageForAccount(acct, key);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete account
  // ---------------------------------------------------------------------------

  async function handleDelete(id: number) {
    await deleteAiAccount(id);
    await deleteSecret(secretKeys.aiAdminKey(id)).catch(() => {
      // key may not exist — ignore
    });
    inFlight.delete(id);
    if (mountedRef.current) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setSummaries((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Add account form
  // ---------------------------------------------------------------------------

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!formKey.trim()) {
      setFormError('Admin API key is required.');
      return;
    }
    setFormSaving(true);
    try {
      const acct = await saveAiAccount({ name: formName.trim(), provider: formProvider });
      await setSecret(secretKeys.aiAdminKey(acct.id), formKey.trim());
      if (mountedRef.current) {
        setAccounts((prev) => [...prev, acct]);
        setFormName('');
        setFormKey('');
        setFormProvider('anthropic');
      }
      // Auto-fetch usage right away
      void fetchUsageForAccount(acct, formKey.trim());
    } catch (err) {
      if (mountedRef.current) setFormError(String(err));
    } finally {
      if (mountedRef.current) setFormSaving(false);
    }
  }

  const anthropicKeyHint =
    'Anthropic: use an sk-ant-admin… key from Claude Console → Org Settings → API Keys.';
  const openaiKeyHint =
    'OpenAI: use an admin key from platform.openai.com → Organization Settings → API Keys.';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">AI Usage</h1>
        {accounts.length > 0 && (
          <div className="page__actions">
            <button className="btn btn--primary" onClick={handleRefreshAll}>
              Refresh all
            </button>
          </div>
        )}
      </div>

      {/* Account list */}
      {accounts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {accounts.map((acct) => (
            <AccountCard
              key={acct.id}
              account={acct}
              summary={summaries.get(acct.id) ?? null}
              loading={loading.has(acct.id)}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add account card */}
      <div className="card settings-card">
        <h2 className="settings-card__title">Add AI account</h2>
        <form onSubmit={handleAdd}>
          <div className="form-field">
            <label className="form-label" htmlFor="ai-name">
              Account name
            </label>
            <input
              id="ai-name"
              type="text"
              className="form-input"
              placeholder="e.g. My Anthropic Org"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="ai-provider">
              Provider
            </label>
            <select
              id="ai-provider"
              className="form-input"
              value={formProvider}
              onChange={(e) => setFormProvider(e.target.value as 'anthropic' | 'openai')}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="ai-key">
              Admin API key
            </label>
            <input
              id="ai-key"
              type="password"
              className="form-input"
              placeholder={formProvider === 'anthropic' ? 'sk-ant-admin…' : 'sk-admin-…'}
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              autoComplete="off"
            />
            <p className="form-hint form-hint--block" style={{ marginTop: 4 }}>
              {formProvider === 'anthropic' ? anthropicKeyHint : openaiKeyHint}
              {' '}Keys are stored in the OS keyring and never written to disk.
            </p>
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" className="btn btn--primary" disabled={formSaving}>
            {formSaving ? 'Saving…' : 'Add account'}
          </button>
        </form>
      </div>

      {accounts.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state__icon">⚡</div>
          <h2 className="empty-state__title">No AI accounts yet</h2>
          <p className="empty-state__body">
            Add an Anthropic or OpenAI admin account above to see token and cost usage across your
            organization.
          </p>
        </div>
      )}
    </div>
  );
}
