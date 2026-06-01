import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import { formatChips } from '../../utils/blindStructures';

export default function BlindDisplay() {
  const { state } = useTournament();
  const { tournament, structure } = state;
  const { currentLevel, status } = tournament;

  const isBreak = status === 'break';
  const levels = structure.levels;
  const totalLevels = levels.length;

  const currentData = levels[currentLevel - 1];
  const nextData = levels[currentLevel]; // currentLevel is 1-indexed so index = currentLevel

  if (!currentData) return null;

  return (
    <div className="blind-display">
      {/* Level label */}
      <div className="level-label">
        {isBreak ? (
          <span className="text-blue">☕ Break — Resume at Level {currentLevel + 1}</span>
        ) : (
          <span>
            Level {currentLevel}
            <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.85em' }}> / {totalLevels}</span>
          </span>
        )}
      </div>

      {!isBreak && (
        <>
          {/* Current blinds */}
          <div className="blinds-row">
            <div className="blind-chip">
              <span className="blind-label">SB</span>
              <span className="blind-val">{formatChips(currentData.sb)}</span>
            </div>
            <div className="blind-sep">/</div>
            <div className="blind-chip">
              <span className="blind-label">BB</span>
              <span className="blind-val">{formatChips(currentData.bb)}</span>
            </div>
            {currentData.ante > 0 && (
              <>
                <div className="blind-sep">·</div>
                <div className="blind-chip ante-chip">
                  <span className="blind-label">Ante</span>
                  <span className="blind-val">{formatChips(currentData.ante)}</span>
                </div>
              </>
            )}
          </div>

          {/* Next level preview */}
          {nextData && (
            <div className="next-level-preview">
              <span className="next-label">Next:</span>
              <span className="next-blinds">
                {formatChips(nextData.sb)}/{formatChips(nextData.bb)}
                {nextData.ante > 0 && ` · Ante ${formatChips(nextData.ante)}`}
              </span>
              {structure.breakLevels && structure.breakLevels.includes(currentLevel) && (
                <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>Then Break</span>
              )}
            </div>
          )}

          {!nextData && (
            <div className="next-level-preview">
              <span className="text-gold">🏆 Final Level</span>
            </div>
          )}
        </>
      )}

      {isBreak && nextData && (
        <div className="break-next">
          <span className="break-next-label">Next Level:</span>
          <span className="break-next-blinds">
            {formatChips(nextData.sb)}/{formatChips(nextData.bb)}
            {nextData.ante > 0 && ` · Ante ${formatChips(nextData.ante)}`}
          </span>
        </div>
      )}

      <style>{`
        .blind-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
        }
        .level-label {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: 0.03em;
        }
        .blinds-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 16px 28px;
        }
        .blind-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .blind-label {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
        }
        .blind-val {
          font-size: 2rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: var(--text);
          line-height: 1;
        }
        .ante-chip .blind-val { color: var(--gold); font-size: 1.5rem; }
        .blind-sep {
          font-size: 2rem;
          color: var(--border);
          font-weight: 300;
          line-height: 1;
        }
        .next-level-preview {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: var(--muted);
        }
        .next-label { font-weight: 700; }
        .next-blinds { color: var(--text); font-weight: 600; }
        .break-next {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          color: var(--blue-light);
        }
        .break-next-label { color: var(--muted); font-weight: 700; }
        .break-next-blinds { font-weight: 700; }
        @media (max-width: 480px) {
          .blind-val { font-size: 1.4rem; }
          .blinds-row { padding: 12px 18px; gap: 8px; }
        }
      `}</style>
    </div>
  );
}
