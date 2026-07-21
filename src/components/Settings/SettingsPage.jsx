import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useLiveQuery } from '../../hooks/useLiveQuery';
import { exportAll, importFile } from '../../data/services/backupService';
import { computeStandings } from '../../data/services/standingsService';
import { tournamentsRepo } from '../../data/repositories/tournamentsRepo';
import { db } from '../../data/db';
import { setMuted } from '../../utils/audioManager';
import { formatMoney } from '../../utils/payoutCalculator';
import ThemePicker from '../ThemePicker';

export default function SettingsPage() {
  const { dbAvailable, settings, updateSettings } = useData();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const soundOn = settings?.soundEnabled !== false;

  const activeSeasonId = settings?.activeSeasonId || null;
  const seasonData = useLiveQuery(
    () => (activeSeasonId ? computeStandings(activeSeasonId) : Promise.resolve(null)),
    [activeSeasonId],
    undefined
  );
  const lastTournament = useLiveQuery(
    async () => (await tournamentsRepo.getAllRecent())[0] || null,
    [],
    undefined
  );

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await exportAll();
      if (res.cancelled) setMessage({ type: 'muted', text: 'Export cancelled.' });
      else setMessage({ type: 'good', text: `Exported ${res.filename}.` });
    } catch (err) {
      setMessage({ type: 'bad', text: `Export failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const s = await importFile(file);
      const text =
        `Import complete — players: +${s.players.added}, ~${s.players.updated}` +
        ` (${s.players.skipped} skipped); tournaments: +${s.tournaments.added}, ~${s.tournaments.updated}.`;
      setMessage({ type: 'good', text });
    } catch (err) {
      setMessage({ type: 'bad', text: `Import failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setMuted(!next);
    await updateSettings({ soundEnabled: next });
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL data — players, tournaments, cash sessions, seasons, and the current tournament? Export a backup first if you want to keep anything. This cannot be undone.')) return;
    if (!confirm('Really delete everything?')) return;
    try {
      await db.delete();
    } catch {
      /* fall through — still clear localStorage */
    }
    localStorage.removeItem('pokerTournamentState');
    window.location.reload();
  };

  const lastBackup = settings?.lastBackupAt
    ? new Date(settings.lastBackupAt).toLocaleString()
    : 'never';

  return (
    <div className="settings-wrap fade-in">
      <h1 className="settings-title">Settings</h1>

      <section className="settings-section card">
        <h2 className="settings-sub">Appearance & Sound</h2>
        <div className="settings-row">
          <span>Theme</span>
          <ThemePicker popupAlign="center" />
        </div>
        <div className="settings-row">
          <span>Timer & level alerts</span>
          <button className={soundOn ? 'btn-green btn-sm' : 'btn-ghost btn-sm'} onClick={toggleSound}>
            {soundOn ? '🔔 Sound on' : '🔇 Muted'}
          </button>
        </div>
      </section>

      <section className="settings-section card">
        <h2 className="settings-sub">Backup & Restore</h2>
        <p className="text-muted settings-desc">
          Your data lives only in this browser. Export a backup file to move
          devices, share a season, or restore after clearing your cache.
        </p>
        {!dbAvailable && dbAvailable !== null ? (
          <p className="settings-warn">
            Offline storage is unavailable in this browser — backups can't be used here.
          </p>
        ) : (
          <>
            <div className="settings-actions">
              <button className="btn-primary" onClick={handleExport} disabled={busy}>
                ⬇ Export backup
              </button>
              <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
                ⬆ Restore from file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </div>
            <p className="text-muted settings-meta">Last backup: {lastBackup}</p>
            {message && (
              <p
                className="settings-message"
                style={{
                  color:
                    message.type === 'bad'
                      ? 'var(--red-light)'
                      : message.type === 'good'
                      ? 'var(--green-light)'
                      : 'var(--muted)',
                }}
              >
                {message.text}
              </p>
            )}
          </>
        )}
      </section>

      <MessageTemplates seasonData={seasonData} lastTournament={lastTournament} />

      <section className="settings-section card danger">
        <h2 className="settings-sub">Danger Zone</h2>
        <p className="text-muted settings-desc">
          Wipe everything stored in this browser — the player directory, all
          archived events, seasons, and any in-progress tournament.
        </p>
        <button className="btn-red btn-sm" onClick={handleClearAll}>🗑 Clear all data</button>
      </section>

      <style>{`
        .settings-wrap { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
        .settings-title { color: var(--gold); font-size: 1.8rem; margin-bottom: 20px; }
        .settings-section { margin-bottom: 20px; }
        .settings-sub { font-size: 1.05rem; margin-bottom: 8px; }
        .settings-desc { font-size: 0.9rem; margin-bottom: 16px; }
        .settings-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 8px 0; font-size: 0.92rem; font-weight: 600;
        }
        .settings-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .settings-meta { font-size: 0.8rem; margin-top: 12px; }
        .settings-message { font-size: 0.88rem; margin-top: 10px; font-weight: 600; }
        .settings-warn {
          background: rgba(245,158,11,0.1); border: 1px solid var(--gold);
          border-radius: var(--radius); padding: 12px; font-size: 0.88rem; color: var(--gold);
        }
        .settings-section.danger { border-color: var(--red); }
        .tmpl-list { display: flex; flex-direction: column; gap: 10px; }
        .tmpl { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; }
        .tmpl-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
        .tmpl-name { font-weight: 800; font-size: 0.88rem; }
        .tmpl-body {
          font-size: 0.82rem; color: var(--muted); white-space: pre-wrap;
          font-family: inherit; line-height: 1.45; margin: 0;
        }
      `}</style>
    </div>
  );
}

/**
 * Copy-paste message templates, pre-filled from live data (the app can't
 * send SMS/email itself — these are ready to paste into a group chat).
 */
function MessageTemplates({ seasonData, lastTournament }) {
  const [copied, setCopied] = useState(null);

  const templates = [];

  templates.push({
    key: 'invite',
    name: '📣 Game starting soon',
    text:
      `♠ Poker night! We're playing [DATE] at [TIME] — [LOCATION].\n` +
      `Buy-in: $[AMOUNT]. Reply to lock in your seat!`,
  });

  if (seasonData?.standings?.length > 0) {
    const top = seasonData.standings
      .slice(0, 5)
      .map((s, i) => `${i + 1}. ${s.name} — ${s.points} pts`)
      .join('\n');
    templates.push({
      key: 'standings',
      name: `🏆 ${seasonData.season.name} standings`,
      text:
        `${seasonData.season.name} standings after ${seasonData.totalEvents} event${seasonData.totalEvents === 1 ? '' : 's'}:\n` +
        `${top}\n` +
        `Top ${seasonData.rules.finaleQualifiers} qualify for the season finale!`,
    });
  }

  if (lastTournament) {
    const podium = (lastTournament.results || [])
      .filter((r) => r.finishPosition && r.finishPosition <= 3)
      .sort((a, b) => a.finishPosition - b.finishPosition)
      .map((r) => {
        const medal = ['🥇', '🥈', '🥉'][r.finishPosition - 1];
        return `${medal} ${r.name}${r.payout > 0 ? ` (${formatMoney(r.payout)})` : ''}`;
      })
      .join('\n');
    if (podium) {
      templates.push({
        key: 'results',
        name: `🃏 ${lastTournament.name} results`,
        text:
          `Results from ${lastTournament.name} (${lastTournament.date}):\n${podium}\n` +
          `Prize pool: ${formatMoney(lastTournament.prizePool || 0)}. Thanks for playing!`,
      });
    }
  }

  const copy = async (t) => {
    try {
      await navigator.clipboard.writeText(t.text);
      setCopied(t.key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="settings-section card">
      <h2 className="settings-sub">Message Templates</h2>
      <p className="text-muted settings-desc">
        Ready-to-paste messages for your group chat — standings and results fill
        in automatically from your data.
      </p>
      <div className="tmpl-list">
        {templates.map((t) => (
          <div key={t.key} className="tmpl">
            <div className="tmpl-head">
              <span className="tmpl-name">{t.name}</span>
              <button className="btn-ghost btn-sm" onClick={() => copy(t)}>
                {copied === t.key ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
            <pre className="tmpl-body">{t.text}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
