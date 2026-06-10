import { useState, useEffect, useCallback, useRef } from 'react';
import type { AiAccount } from '../lib/db';
import { listAiAccounts, saveAiAccount, deleteAiAccount, getSetting, setSetting } from '../lib/db';
import { getSecret, setSecret, deleteSecret, secretKeys } from '../lib/secrets';
import { fetchAiUsage } from '../adapters/ai';
import type { AiUsageSummary } from '../adapters/ai';
import { t, useI18n } from '../lib/i18n';

// ---------------------------------------------------------------------------
// Period type
// ---------------------------------------------------------------------------

type Period = '24h' | '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Period, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
const PERIOD_LABELS: Period[] = ['24h', '7d', '30d', '90d'];

function periodSettingKey(accountId: number): string {
  return `ai_period_${accountId}`;
}

function parsePeriod(raw: string | null): Period {
  if (raw === '24h' || raw === '7d' || raw === '30d' || raw === '90d') return raw;
  return '30d';
}

// ---------------------------------------------------------------------------
// Module-level in-flight promise registry — deduped per `${accountId}:${daysBack}`
// so period changes never reuse a stale in-flight promise.
// ---------------------------------------------------------------------------
const inFlight = new Map<string, Promise<AiUsageSummary>>();

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

/** YYYY-MM prefix for the current calendar month */
function currentMonthPrefix(): string {
  return new Date().toISOString().slice(0, 7);
}

/** First day of the current calendar month (YYYY-MM-01) */
function currentMonthStart(): string {
  return `${currentMonthPrefix()}-01`;
}

/** Sum costUsd for all days in the current calendar month */
function monthToDateCost(days: AiUsageSummary['days']): number | null {
  const prefix = currentMonthPrefix();
  const monthDays = days.filter((d) => d.date.startsWith(prefix) && d.costUsd !== null);
  if (monthDays.length === 0) return null;
  return monthDays.reduce((s, d) => s + (d.costUsd ?? 0), 0);
}

function budgetSettingKey(accountId: number): string {
  return `ai_budget_usd_${accountId}`;
}

function balanceSettingKey(accountId: number): string {
  return `ai_balance_usd_${accountId}`;
}

function balanceDateSettingKey(accountId: number): string {
  return `ai_balance_date_${accountId}`;
}

/**
 * Sum costUsd for all days with date >= snapshotDate.
 * Returns null if no days with known cost exist on or after that date.
 * NOTE: costs on the snapshot day before the snapshot moment are
 * slightly double-counted — acceptable for an estimate.
 */
function costSinceDate(days: AiUsageSummary['days'], snapshotDate: string): number | null {
  const relevant = days.filter((d) => d.date >= snapshotDate && d.costUsd !== null);
  if (relevant.length === 0) return null;
  return relevant.reduce((s, d) => s + (d.costUsd ?? 0), 0);
}

/** Earliest date present in a summary's days array, or null if empty. */
function earliestDay(days: AiUsageSummary['days']): string | null {
  if (days.length === 0) return null;
  return days.reduce((min, d) => (d.date < min ? d.date : min), days[0].date);
}

// ---------------------------------------------------------------------------
// Mini bar chart (inline divs, no libs)
// Bar height = total tokens: uncached input + cache read + cache creation + output.
// ---------------------------------------------------------------------------

function DailyBarChart({ days }: { days: AiUsageSummary['days'] }) {
  useI18n(); // subscribe so tooltips re-translate on language switch
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
            title={t('ai.chart.barTooltip', {
              date: d.date,
              total: fmtTokens(total),
              input: fmtTokens(d.inputTokens),
              cacheRead: fmtTokens(d.cacheReadTokens),
              cacheWrite: fmtTokens(d.cacheCreationTokens),
              output: fmtTokens(d.outputTokens),
            })}
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
// Budget progress bar + remaining
// ---------------------------------------------------------------------------

interface BudgetBarProps {
  spent: number;
  budget: number;
}

function BudgetBar({ spent, budget }: BudgetBarProps) {
  useI18n(); // subscribe so labels re-translate on language switch
  const pct = Math.min((spent / budget) * 100, 100);
  const remaining = budget - spent;
  const isNearlyOut = pct >= 90;
  const isWarning = pct >= 70 && pct < 90;
  const barColor = isNearlyOut ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
  const remainingColor = remaining <= 0 || isNearlyOut
    ? 'var(--error, #ef4444)'
    : 'inherit';

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        <span>{t('ai.budget.monthlyBudget')}</span>
        <span style={{ color: remainingColor, fontWeight: remaining <= 0 ? 700 : 400 }}>
          {remaining <= 0
            ? t('ai.budget.overBudget', { amount: fmtCost(Math.abs(remaining)) })
            : t('ai.budget.remaining', { amount: fmtCost(remaining) })}
        </span>
      </div>
      {/* Track */}
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border, #3a3a4a)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 3,
            background: barColor,
            transition: 'width 0.3s, background 0.3s',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
        <span>{t('ai.budget.spent', { amount: fmtCost(spent) })}</span>
        <span>{t('ai.budget.budgetLabel', { amount: fmtCost(budget) })}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Period segmented control
// ---------------------------------------------------------------------------

interface PeriodSwitcherProps {
  value: Period;
  onChange: (p: Period) => void;
}

function PeriodSwitcher({ value, onChange }: PeriodSwitcherProps) {
  useI18n(); // subscribe so period labels re-translate on language switch
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {PERIOD_LABELS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
            border: '1px solid var(--border, #3a3a4a)',
            background: value === p ? 'var(--accent, #4f8ef7)' : 'transparent',
            color: value === p ? '#fff' : 'var(--text-muted)',
            cursor: 'pointer',
            fontWeight: value === p ? 600 : 400,
            lineHeight: 1.4,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {t(`ai.period.${p}`)}
        </button>
      ))}
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

interface BalanceSnapshot {
  usd: number;
  date: string; // YYYY-MM-DD
}

interface AccountCardProps {
  account: AiAccount;
  summary: AiUsageSummary | null;
  loading: boolean;
  period: Period;
  budget: number | null;
  balance: BalanceSnapshot | null;
  onRefresh: (id: number) => void;
  onDelete: (id: number) => void;
  onPeriodChange: (id: number, p: Period) => void;
  onBudgetSave: (id: number, value: number | null) => void;
  onBalanceSave: (id: number, value: number | null) => void;
}

function AccountCard({
  account, summary, loading, period, budget, balance,
  onRefresh, onDelete, onPeriodChange, onBudgetSave, onBalanceSave,
}: AccountCardProps) {
  useI18n(); // subscribe to language changes so card re-renders on lang switch
  const today = summary?.days.find((d) => d.date === todayStr());
  const todayTotal = today
    ? today.inputTokens + today.cacheReadTokens + today.cacheCreationTokens + today.outputTokens
    : null;

  // Budget inline editor state
  const [budgetInput, setBudgetInput] = useState(budget != null ? String(budget) : '');
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetEditing, setBudgetEditing] = useState(false);

  // Sync input when budget prop changes (e.g. initial load)
  useEffect(() => {
    if (!budgetEditing) {
      setBudgetInput(budget != null ? String(budget) : '');
    }
  }, [budget, budgetEditing]);

  async function handleBudgetSave() {
    const trimmed = budgetInput.trim();
    if (trimmed === '') {
      setBudgetSaving(true);
      await onBudgetSave(account.id, null);
      setBudgetSaving(false);
      setBudgetEditing(false);
      return;
    }
    const n = parseFloat(trimmed);
    if (isNaN(n) || n < 0) return;
    setBudgetSaving(true);
    await onBudgetSave(account.id, n);
    setBudgetSaving(false);
    setBudgetEditing(false);
  }

  // Balance inline editor state
  const [balanceInput, setBalanceInput] = useState(balance != null ? String(balance.usd) : '');
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceEditing, setBalanceEditing] = useState(false);

  // Sync input when balance prop changes (e.g. initial load)
  useEffect(() => {
    if (!balanceEditing) {
      setBalanceInput(balance != null ? String(balance.usd) : '');
    }
  }, [balance, balanceEditing]);

  async function handleBalanceSave() {
    const trimmed = balanceInput.trim();
    if (trimmed === '') {
      setBalanceSaving(true);
      await onBalanceSave(account.id, null);
      setBalanceSaving(false);
      setBalanceEditing(false);
      return;
    }
    const n = parseFloat(trimmed);
    if (isNaN(n) || n < 0) return;
    setBalanceSaving(true);
    await onBalanceSave(account.id, n);
    setBalanceSaving(false);
    setBalanceEditing(false);
  }

  const costKnown = summary !== null && !summary.error && summary.costError === null;
  const mtdCost = costKnown && summary ? (monthToDateCost(summary.days) ?? 0) : null;

  // Estimated balance computation
  const spentSinceSnapshot =
    costKnown && balance !== null && summary !== null
      ? (costSinceDate(summary.days, balance.date) ?? 0)
      : null;
  const estimatedBalance =
    balance !== null && spentSinceSnapshot !== null
      ? balance.usd - spentSinceSnapshot
      : null;
  // Color thresholds: red ≤ $1 or negative; amber ≤ 10% of snapshot
  const balanceIsRed =
    estimatedBalance !== null && (estimatedBalance <= 1 || estimatedBalance < 0);
  const balanceIsAmber =
    estimatedBalance !== null &&
    !balanceIsRed &&
    balance !== null &&
    balance.usd > 0 &&
    estimatedBalance / balance.usd <= 0.1;
  const balanceColor = balanceIsRed
    ? 'var(--error, #ef4444)'
    : balanceIsAmber
      ? '#f59e0b'
      : 'inherit';

  // Period label for display (translated compact label)
  const periodLabel = t(`ai.period.${period}`);

  // Determine whether the fetched window covers the whole current month
  // (for budget) or back to the balance snapshot date (for balance).
  const earliest = summary ? earliestDay(summary.days) : null;
  const windowTooShortForBudget =
    earliest !== null && earliest > currentMonthStart();
  const windowTooShortForBalance =
    balance !== null && earliest !== null && earliest > balance.date;

  // Chart caption
  const chartCaption =
    period === '24h'
      ? t('ai.chart.captionToday')
      : t('ai.chart.captionPeriod', { period: periodLabel });

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProviderBadge provider={account.provider} />
          <span style={{ fontWeight: 600 }}>{account.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PeriodSwitcher value={period} onChange={(p) => onPeriodChange(account.id, p)} />
          <button
            className="btn"
            disabled={loading}
            onClick={() => onRefresh(account.id)}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {loading ? t('ai.card.loading') : t('common.refresh')}
          </button>
          <button
            className="btn"
            onClick={() => onDelete(account.id)}
            style={{ fontSize: 12, padding: '4px 10px', color: 'var(--error, #ef4444)' }}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      {/* Usage-level error */}
      {summary?.error && (
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--error, #ef4444)' }}>
          {summary.error}
        </p>
      )}

      {summary && !summary.error && (
        <>
          {/* Token + cost stats grid */}
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
                {t('ai.stats.inputTokens', { period: periodLabel })}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmtTokens(summary.totalInput)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                {t('ai.stats.outputTokens', { period: periodLabel })}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{fmtTokens(summary.totalOutput)}</div>
            </div>
            {summary.totalCacheRead > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {t('ai.stats.cacheReadTokens', { period: periodLabel })}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {fmtTokens(summary.totalCacheRead)}
                </div>
              </div>
            )}
            {summary.totalCacheCreation > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {t('ai.stats.cacheWriteTokens', { period: periodLabel })}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {fmtTokens(summary.totalCacheCreation)}
                </div>
              </div>
            )}
            {summary.totalCostUsd !== null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {t('ai.stats.cost', { period: periodLabel })}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {fmtCost(summary.totalCostUsd)}
                </div>
              </div>
            )}
            {todayTotal !== null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {t('ai.stats.todayTokens')}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{fmtTokens(todayTotal)}</div>
              </div>
            )}
          </div>

          {/* Cost endpoint error — shown below stats, not as a full-card error */}
          {summary.costError && (
            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              {t('ai.stats.costUnavailable')}{summary.costError}
            </p>
          )}

          {/* Budget section */}
          {budget != null && costKnown && mtdCost !== null && !windowTooShortForBudget && (
            <BudgetBar spent={mtdCost} budget={budget} />
          )}
          {budget != null && costKnown && windowTooShortForBudget && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {t('ai.budget.switchPeriod')}
            </p>
          )}
          {budget != null && !costKnown && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {t('ai.budget.costUnavailable')}
            </p>
          )}

          {/* Estimated balance section */}
          {balance !== null && estimatedBalance !== null && !windowTooShortForBalance && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                {t('ai.balance.estimatedLabel')}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: balanceColor }}>
                {estimatedBalance < 0 ? `-${fmtCost(Math.abs(estimatedBalance))}` : fmtCost(estimatedBalance)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {t('ai.balance.snapshotNote', {
                  date: balance.date,
                  snapshotAmount: fmtCost(balance.usd),
                  spentAmount: fmtCost(spentSinceSnapshot ?? 0),
                })}
              </div>
            </div>
          )}
          {balance !== null && costKnown && windowTooShortForBalance && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {t('ai.budget.switchPeriod')}
            </p>
          )}
          {balance !== null && !costKnown && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              {t('ai.balance.costUnavailable')}
            </p>
          )}

          {/* Daily bar chart */}
          {summary.days.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                {chartCaption}
              </div>
              <DailyBarChart days={summary.days} />
            </div>
          )}
        </>
      )}

      {!summary && !loading && (
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
          {t('ai.card.noKey')}
        </p>
      )}

      {/* Monthly budget editor */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border, #3a3a4a)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{t('ai.budgetEditor.label')}</span>
        <input
          type="number"
          min={0}
          step={0.01}
          className="form-input"
          style={{ width: 90, fontSize: 12, padding: '3px 6px' }}
          placeholder={t('ai.budgetEditor.placeholder')}
          value={budgetInput}
          onChange={(e) => { setBudgetInput(e.target.value); setBudgetEditing(true); }}
          onBlur={() => { if (!budgetEditing) return; }}
        />
        <button
          className="btn btn--primary"
          style={{ fontSize: 12, padding: '3px 10px' }}
          disabled={budgetSaving}
          onClick={handleBudgetSave}
        >
          {budgetSaving ? '…' : t('common.save')}
        </button>
        {budget != null && (
          <button
            className="btn"
            style={{ fontSize: 12, padding: '3px 8px', color: 'var(--text-muted)' }}
            onClick={() => { setBudgetInput(''); setBudgetEditing(true); void (async () => { setBudgetSaving(true); await onBudgetSave(account.id, null); setBudgetSaving(false); setBudgetEditing(false); })(); }}
          >
            {t('ai.budgetEditor.clear')}
          </button>
        )}
      </div>

      {/* Credit balance snapshot editor */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{t('ai.balanceEditor.label')}</span>
        <input
          type="number"
          min={0}
          step={0.01}
          className="form-input"
          style={{ width: 90, fontSize: 12, padding: '3px 6px' }}
          placeholder={t('ai.balanceEditor.placeholder')}
          value={balanceInput}
          onChange={(e) => { setBalanceInput(e.target.value); setBalanceEditing(true); }}
        />
        <button
          className="btn btn--primary"
          style={{ fontSize: 12, padding: '3px 10px' }}
          disabled={balanceSaving}
          onClick={handleBalanceSave}
        >
          {balanceSaving ? '…' : t('common.save')}
        </button>
        {balance != null && (
          <button
            className="btn"
            style={{ fontSize: 12, padding: '3px 8px', color: 'var(--text-muted)' }}
            onClick={() => { setBalanceInput(''); setBalanceEditing(true); void (async () => { setBalanceSaving(true); await onBalanceSave(account.id, null); setBalanceSaving(false); setBalanceEditing(false); })(); }}
          >
            {t('ai.balanceEditor.clear')}
          </button>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {t('ai.balanceEditor.hint')}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function AiUsage() {
  useI18n(); // subscribe to language changes so page re-renders on lang switch
  const [accounts, setAccounts] = useState<AiAccount[]>([]);
  const [summaries, setSummaries] = useState<Map<number, AiUsageSummary>>(new Map());
  const [loading, setLoading] = useState<Set<number>>(new Set());
  const [periods, setPeriods] = useState<Map<number, Period>>(new Map());
  const [budgets, setBudgets] = useState<Map<number, number>>(new Map());
  const [balances, setBalances] = useState<Map<number, BalanceSnapshot>>(new Map());

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

    // Load periods, budgets and balances for all accounts
    const periodMap = new Map<number, Period>();
    const budgetMap = new Map<number, number>();
    const balanceMap = new Map<number, BalanceSnapshot>();
    for (const acct of list) {
      const rawPeriod = await getSetting(periodSettingKey(acct.id));
      periodMap.set(acct.id, parsePeriod(rawPeriod));

      const rawBudget = await getSetting(budgetSettingKey(acct.id));
      if (rawBudget !== null) {
        const n = parseFloat(rawBudget);
        if (!isNaN(n)) budgetMap.set(acct.id, n);
      }
      const rawBalance = await getSetting(balanceSettingKey(acct.id));
      const rawBalanceDate = await getSetting(balanceDateSettingKey(acct.id));
      if (rawBalance !== null && rawBalanceDate !== null) {
        const n = parseFloat(rawBalance);
        if (!isNaN(n) && rawBalanceDate.length === 10) {
          balanceMap.set(acct.id, { usd: n, date: rawBalanceDate });
        }
      }
    }
    if (mountedRef.current) {
      setPeriods(periodMap);
      setBudgets(budgetMap);
      setBalances(balanceMap);
    }

    // Auto-fetch usage for all accounts that have a stored key
    for (const acct of list) {
      const key = await getSecret(secretKeys.aiAdminKey(acct.id));
      const p = periodMap.get(acct.id) ?? '30d';
      if (key) void fetchUsageForAccount(acct, key, PERIOD_DAYS[p]);
    }
  }

  // ---------------------------------------------------------------------------
  // Fetch usage — deduped per `${accountId}:${daysBack}`
  // ---------------------------------------------------------------------------

  const fetchUsageForAccount = useCallback(
    async (acct: AiAccount, adminKey: string, daysBack: number) => {
      const flightKey = `${acct.id}:${daysBack}`;

      // If there is already an in-flight request for this account+period, reuse it
      const existing = inFlight.get(flightKey);
      if (existing) {
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
          costError: null as null,
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

      const promise = fetchAiUsage(acct, adminKey, daysBack);
      inFlight.set(flightKey, promise);

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
          costError: null,
          error: String(e),
        };
      } finally {
        inFlight.delete(flightKey);
      }

      if (mountedRef.current) {
        setSummaries((prev) => new Map(prev).set(acct.id, summary));
        setLoading((prev) => {
          const next = new Set(prev);
          next.delete(acct.id);
          return next;
        });
      }
    },
    [],
  );

  async function handleRefresh(id: number) {
    const acct = accounts.find((a) => a.id === id);
    if (!acct) return;
    const key = await getSecret(secretKeys.aiAdminKey(id));
    const p = periods.get(id) ?? '30d';
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
            costError: null,
            error: t('ai.card.noKeyError'),
          }),
        );
      }
      return;
    }
    void fetchUsageForAccount(acct, key, PERIOD_DAYS[p]);
  }

  async function handleRefreshAll() {
    for (const acct of accounts) {
      const key = await getSecret(secretKeys.aiAdminKey(acct.id));
      const p = periods.get(acct.id) ?? '30d';
      if (key) void fetchUsageForAccount(acct, key, PERIOD_DAYS[p]);
    }
  }

  // ---------------------------------------------------------------------------
  // Period change
  // ---------------------------------------------------------------------------

  async function handlePeriodChange(id: number, p: Period) {
    // Update state immediately
    setPeriods((prev) => new Map(prev).set(id, p));
    // Persist
    await setSetting(periodSettingKey(id), p);
    // Refetch for this account with the new period
    const acct = accounts.find((a) => a.id === id);
    if (!acct) return;
    const key = await getSecret(secretKeys.aiAdminKey(id));
    if (key) void fetchUsageForAccount(acct, key, PERIOD_DAYS[p]);
  }

  // ---------------------------------------------------------------------------
  // Budget
  // ---------------------------------------------------------------------------

  async function handleBudgetSave(id: number, value: number | null) {
    if (value === null) {
      // Clear: we store empty string as sentinel; getSetting will return '' which parseFloat ignores
      await setSetting(budgetSettingKey(id), '');
      if (mountedRef.current) {
        setBudgets((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    } else {
      await setSetting(budgetSettingKey(id), String(value));
      if (mountedRef.current) {
        setBudgets((prev) => new Map(prev).set(id, value));
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Balance
  // ---------------------------------------------------------------------------

  async function handleBalanceSave(id: number, value: number | null) {
    if (value === null) {
      await setSetting(balanceSettingKey(id), '');
      await setSetting(balanceDateSettingKey(id), '');
      if (mountedRef.current) {
        setBalances((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    } else {
      const date = todayStr();
      await setSetting(balanceSettingKey(id), String(value));
      await setSetting(balanceDateSettingKey(id), date);
      if (mountedRef.current) {
        setBalances((prev) => new Map(prev).set(id, { usd: value, date }));
      }
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
    // Clear budget, balance, and period settings
    await setSetting(budgetSettingKey(id), '').catch(() => undefined);
    await setSetting(balanceSettingKey(id), '').catch(() => undefined);
    await setSetting(balanceDateSettingKey(id), '').catch(() => undefined);
    await setSetting(periodSettingKey(id), '').catch(() => undefined);
    // Clear any in-flight promises for this account (all periods)
    for (const p of PERIOD_LABELS) {
      inFlight.delete(`${id}:${PERIOD_DAYS[p]}`);
    }
    if (mountedRef.current) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setSummaries((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setBudgets((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setBalances((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setPeriods((prev) => {
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
      setFormError(t('ai.addForm.errorNameRequired'));
      return;
    }
    if (!formKey.trim()) {
      setFormError(t('ai.addForm.errorKeyRequired'));
      return;
    }
    setFormSaving(true);
    try {
      const acct = await saveAiAccount({ name: formName.trim(), provider: formProvider });
      await setSecret(secretKeys.aiAdminKey(acct.id), formKey.trim());
      if (mountedRef.current) {
        setAccounts((prev) => [...prev, acct]);
        setPeriods((prev) => new Map(prev).set(acct.id, '30d'));
        setFormName('');
        setFormKey('');
        setFormProvider('anthropic');
      }
      // Auto-fetch usage right away with default period
      void fetchUsageForAccount(acct, formKey.trim(), PERIOD_DAYS['30d']);
    } catch (err) {
      if (mountedRef.current) setFormError(String(err));
    } finally {
      if (mountedRef.current) setFormSaving(false);
    }
  }

  const anthropicKeyHint = t('ai.addForm.keyHintAnthropic');
  const openaiKeyHint = t('ai.addForm.keyHintOpenAI');

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('ai.page.title')}</h1>
        {accounts.length > 0 && (
          <div className="page__actions">
            <button className="btn btn--primary" onClick={handleRefreshAll}>
              {t('ai.page.refreshAll')}
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
              period={periods.get(acct.id) ?? '30d'}
              budget={budgets.get(acct.id) ?? null}
              balance={balances.get(acct.id) ?? null}
              onRefresh={handleRefresh}
              onDelete={handleDelete}
              onPeriodChange={handlePeriodChange}
              onBudgetSave={handleBudgetSave}
              onBalanceSave={handleBalanceSave}
            />
          ))}
        </div>
      )}

      {/* Add account card */}
      <div className="card settings-card">
        <h2 className="settings-card__title">{t('ai.addForm.title')}</h2>
        <form onSubmit={handleAdd}>
          <div className="form-field">
            <label className="form-label" htmlFor="ai-name">
              {t('ai.addForm.nameLabel')}
            </label>
            <input
              id="ai-name"
              type="text"
              className="form-input"
              placeholder={t('ai.addForm.namePlaceholder')}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="ai-provider">
              {t('ai.addForm.providerLabel')}
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
              {t('ai.addForm.keyLabel')}
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
              {' '}{t('ai.addForm.keyStorageNote')}
            </p>
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <button type="submit" className="btn btn--primary" disabled={formSaving}>
            {formSaving ? t('ai.addForm.submitSaving') : t('ai.addForm.submit')}
          </button>
        </form>
      </div>

      {accounts.length === 0 && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state__icon">⚡</div>
          <h2 className="empty-state__title">{t('ai.empty.title')}</h2>
          <p className="empty-state__body">
            {t('ai.empty.body')}
          </p>
        </div>
      )}
    </div>
  );
}
