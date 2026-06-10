import React, { useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { exportAll, importFile } from '../../data/services/backupService';

export default function SettingsPage() {
  const { dbAvailable, settings } = useData();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

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

  const lastBackup = settings?.lastBackupAt
    ? new Date(settings.lastBackupAt).toLocaleString()
    : 'never';

  return (
    <div className="settings-wrap fade-in">
      <h1 className="settings-title">Settings</h1>

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

      <style>{`
        .settings-wrap { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; width: 100%; }
        .settings-title { color: var(--gold); font-size: 1.8rem; margin-bottom: 20px; }
        .settings-sub { font-size: 1.05rem; margin-bottom: 8px; }
        .settings-desc { font-size: 0.9rem; margin-bottom: 16px; }
        .settings-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .settings-meta { font-size: 0.8rem; margin-top: 12px; }
        .settings-message { font-size: 0.88rem; margin-top: 10px; font-weight: 600; }
        .settings-warn {
          background: rgba(245,158,11,0.1); border: 1px solid var(--gold);
          border-radius: var(--radius); padding: 12px; font-size: 0.88rem; color: var(--gold);
        }
      `}</style>
    </div>
  );
}
