import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { formatChips } from '../../utils/blindStructures';

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function fmtClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function BlindSchedule() {
  const { state } = useTournament();
  const { structure, tournament, config } = state;
  const { levels, levelDuration, breakDuration, breakLevels } = structure;
  const currentLevel = tournament.currentLevel;

  // Build timeline rows including breaks
  const rows = [];
  let elapsed = 0;
  levels.forEach((lvl, idx) => {
    rows.push({ type: 'level', lvl, startTime: elapsed });
    elapsed += levelDuration;
    if (breakLevels && breakLevels.includes(lvl.level) && idx < levels.length - 1) {
      rows.push({ type: 'break', after: lvl.level, startTime: elapsed });
      elapsed += breakDuration;
    }
  });

  const print = () => window.print();

  return (
    <div className="blind-schedule">
      <div className="schedule-toolbar no-print">
        <div>
          <span className="schedule-name">{config.name} — Blind Schedule</span>
          <span className="text-muted" style={{ fontSize: '0.82rem', marginLeft: 12 }}>
            {levels.length} levels · {fmtClock(elapsed)} total
          </span>
        </div>
        <button className="btn-ghost btn-sm" onClick={print}>🖨 Print</button>
      </div>

      <table className="schedule-table">
        <thead>
          <tr>
            <th className="col-level">#</th>
            <th>Small Blind</th>
            <th>Big Blind</th>
            <th>Ante</th>
            <th>Duration</th>
            <th>Elapsed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            if (row.type === 'break') {
              return (
                <tr key={`break-${row.after}`} className="schedule-break-row">
                  <td colSpan={6}>
                    ☕ BREAK &nbsp;·&nbsp; {fmtTime(breakDuration)}
                    &nbsp;·&nbsp;
                    <span className="text-muted">Starts at {fmtClock(row.startTime)}</span>
                  </td>
                </tr>
              );
            }
            const { lvl, startTime } = row;
            const isCurrent = lvl.level === currentLevel;
            const isPast = lvl.level < currentLevel && tournament.phase === 'running';
            return (
              <tr
                key={lvl.level}
                className={`schedule-level-row ${isCurrent ? 'current-level' : ''} ${isPast ? 'past-level' : ''}`}
              >
                <td className="col-level">
                  {isCurrent ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="current-dot" />
                      {lvl.level}
                    </span>
                  ) : lvl.level}
                </td>
                <td>{formatChips(lvl.sb)}</td>
                <td>{formatChips(lvl.bb)}</td>
                <td>{lvl.ante > 0 ? formatChips(lvl.ante) : '—'}</td>
                <td>{fmtTime(levelDuration)}</td>
                <td className="text-muted">{fmtClock(startTime)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        .blind-schedule {}
        .schedule-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .schedule-name {
          font-size: 1rem;
          font-weight: 800;
          color: var(--gold);
        }
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        .schedule-table th {
          padding: 10px 14px;
          text-align: left;
          color: var(--muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--border);
          background: var(--surface);
          position: sticky;
          top: 0;
        }
        .schedule-table td {
          padding: 9px 14px;
          border-bottom: 1px solid rgba(55,65,81,0.5);
          color: var(--text);
        }
        .col-level { width: 48px; color: var(--muted); font-weight: 700; }
        .schedule-level-row:hover td { background: rgba(255,255,255,0.03); }
        .current-level td {
          background: rgba(245,158,11,0.1) !important;
          font-weight: 700;
        }
        .current-level td:first-child { color: var(--gold); }
        .past-level td { opacity: 0.45; }
        .current-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
          animation: pulse-red 1s infinite;
        }
        .schedule-break-row td {
          text-align: center;
          color: var(--blue-light);
          font-weight: 700;
          font-size: 0.85rem;
          background: rgba(59,130,246,0.08);
          padding: 14px;
          border-top: 2px solid rgba(59,130,246,0.3);
          border-bottom: 2px solid rgba(59,130,246,0.3);
        }
        @media print {
          .schedule-toolbar { display: none; }
          .schedule-table th { background: #eee; color: #333; }
          .schedule-table td { color: #000; border-bottom: 1px solid #ccc; }
          .schedule-break-row td { background: #e8f0fe; color: #1a56db; }
          .current-level td { background: #fef9e7 !important; }
          .past-level td { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
