import { useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import { buildDepsReport, type DepsReport } from '../adapters/deps';
import { getSetting, setSetting } from '../lib/db';
import { timeAgo } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { buildDepsDoc } from '../lib/handover';
import { copyText } from '../lib/clipboard';
import { DepsReportView } from './DepsReportView';

interface DependenciesCardProps {
  project: Project;
}

export function DependenciesCard({ project }: DependenciesCardProps) {
  const { t } = useI18n();
  const [report, setReport] = useState<DepsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cancelledRef = useRef(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const settingKey = `deps_report_${project.id}`;

  // Load persisted report on mount.
  useEffect(() => {
    cancelledRef.current = false;
    getSetting(settingKey).then(raw => {
      if (cancelledRef.current || !raw) return;
      try {
        const parsed = JSON.parse(raw) as DepsReport;
        setReport(parsed);
      } catch {
        // Malformed — ignore.
      }
    }).catch(() => { /* db unavailable — ignore */ });
    return () => { cancelledRef.current = true; };
  }, [settingKey]);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    cancelledRef.current = false;
    try {
      const result = await buildDepsReport(project);
      if (cancelledRef.current) return;
      setReport(result);
      try {
        await setSetting(settingKey, JSON.stringify(result));
      } catch {
        // Persist failure is non-fatal.
      }
    } catch (err) {
      if (cancelledRef.current) return;
      setError(String(err));
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }

  return (
    <div className="card">
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <h3 className="card__subtitle" style={{ margin: 0 }}>{t('detail.deps.cardTitle')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {report && (
            <span className="muted" style={{ fontSize: 12 }}>
              {t('detail.deps.lastChecked', { ago: timeAgo(report.generatedAt) })}
            </span>
          )}
          {copied && <span className="settings-saved">{t('detail.deps.aiCopied')}</span>}
          {report && report.deps.length > 0 && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={async () => {
                const ok = await copyText(buildDepsDoc(project.name, report));
                if (!ok) return;
                setCopied(true);
                copiedTimer.current = setTimeout(() => setCopied(false), 2500);
              }}
            >
              {t('detail.deps.aiCopy')}
            </button>
          )}
          <button
            className="btn btn--ghost btn--sm btn--icon-label"
            onClick={handleCheck}
            disabled={loading}
          >
            <span className={loading ? 'btn__icon--spin' : ''}>↻</span>
            {loading ? t('detail.deps.checking') : t('detail.deps.check')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-critical" style={{ fontSize: 13, marginTop: 10 }}>
          {t('detail.deps.error')} {error}
        </p>
      )}

      {/* Empty state */}
      {!report && !loading && !error && (
        <div style={{ marginTop: 10 }}>
          <p className="muted" style={{ fontSize: 13 }}>{t('detail.deps.notChecked')}</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{t('detail.deps.hint')}</p>
        </div>
      )}

      {/* Report */}
      {report && <DepsReportView report={report} />}
    </div>
  );
}
