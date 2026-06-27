import { useRef, useState } from 'react';
import {
  analyzePastedManifest,
  type DepsReport,
  type ManifestKind,
} from '../adapters/deps';
import { useI18n } from '../lib/i18n';
import { buildDepsDoc } from '../lib/handover';
import { copyText } from '../lib/clipboard';
import { timeAgo } from '../lib/format';
import { DepsReportView } from '../components/DepsReportView';

type Tab = 'deps';

export function Utilities() {
  const { t } = useI18n();
  const [tab] = useState<Tab>('deps');

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('utilities.title')}</h1>
      </div>
      <p className="page__subtitle muted" style={{ marginTop: 4 }}>
        {t('utilities.subtitle')}
      </p>

      {/* Tab bar — single tool today, but laid out for future utilities. */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginTop: 20,
          marginBottom: 16,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          className="btn btn--ghost btn--sm"
          style={{
            borderRadius: 0,
            borderBottom: tab === 'deps' ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === 'deps' ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          {t('utilities.tab.deps')}
        </button>
      </div>

      {tab === 'deps' && <DependenciesAnalyzer />}
    </div>
  );
}

function DependenciesAnalyzer() {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<ManifestKind>('auto');
  const [report, setReport] = useState<DepsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Infer the manifest type from a dropped file's name (best-effort).
  function kindFromFilename(name: string): ManifestKind | null {
    const n = name.toLowerCase();
    if (n === 'package.json' || n.endsWith('.json')) return 'package.json';
    if (n.endsWith('.txt')) return 'requirements.txt';
    return null;
  }

  async function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setText(content);
      setReport(null);
      setError(null);
      const inferred = kindFromFilename(file.name);
      if (inferred) setKind(inferred);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePastedManifest(text, kind);
      setReport(result);
    } catch (err) {
      setReport(null);
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setText('');
    setReport(null);
    setError(null);
  }

  async function handleCopy() {
    if (!report) return;
    const ok = await copyText(buildDepsDoc('Pasted manifest', report));
    if (!ok) return;
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="card">
      <h3 className="card__subtitle" style={{ margin: 0 }}>{t('utilities.deps.heading')}</h3>
      <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        {t('utilities.deps.description')}
      </p>

      {/* Manifest type selector */}
      <div className="form-field" style={{ marginTop: 14, maxWidth: 280 }}>
        <label className="form-label" htmlFor="util-deps-kind">
          {t('utilities.deps.kindLabel')}
        </label>
        <select
          id="util-deps-kind"
          className="form-select"
          value={kind}
          onChange={e => setKind(e.target.value as ManifestKind)}
        >
          <option value="auto">{t('utilities.deps.kind.auto')}</option>
          <option value="package.json">{t('utilities.deps.kind.package')}</option>
          <option value="requirements.txt">{t('utilities.deps.kind.requirements')}</option>
        </select>
      </div>

      {/* Paste / drop area */}
      <div className="form-field" style={{ marginTop: 14 }}>
        <textarea
          className="form-input form-textarea"
          style={{
            minHeight: 200,
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            ...(dragging
              ? { borderColor: 'var(--accent)', borderStyle: 'dashed', background: 'var(--accent-dim)' }
              : {}),
          }}
          value={text}
          spellCheck={false}
          onChange={e => setText(e.target.value)}
          onDragOver={e => { e.preventDefault(); if (!dragging) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          placeholder={t('utilities.deps.placeholder')}
        />
        <p className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
          {t('utilities.deps.dropHint')}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button
          className="btn btn--primary"
          onClick={handleAnalyze}
          disabled={loading || text.trim() === ''}
        >
          {loading ? t('utilities.deps.analyzing') : t('utilities.deps.analyze')}
        </button>
        <button
          className="btn btn--ghost btn--sm"
          onClick={handleClear}
          disabled={loading || (text === '' && !report && !error)}
        >
          {t('utilities.deps.clear')}
        </button>
        {report && report.deps.length > 0 && (
          <button className="btn btn--ghost btn--sm" onClick={handleCopy}>
            {t('detail.deps.aiCopy')}
          </button>
        )}
        {copied && <span className="settings-saved">{t('detail.deps.aiCopied')}</span>}
        {report && (
          <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>
            {t('detail.deps.lastChecked', { ago: timeAgo(report.generatedAt) })}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-critical" style={{ fontSize: 13, marginTop: 12 }}>
          {t('utilities.deps.error')} {error}
        </p>
      )}

      {/* Empty state */}
      {!report && !error && !loading && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          {t('utilities.deps.empty')}
        </p>
      )}

      {/* Result */}
      {report && <DepsReportView report={report} />}
    </div>
  );
}
