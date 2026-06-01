import React, { useEffect, useRef } from 'react';
import { useTournament } from '../../context/TournamentContext';
import {
  calculatePayouts,
  formatMoney,
} from '../../utils/payoutCalculator';
import { playLevelUpChime } from '../../utils/audioManager';

// Confetti particle component
function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      size: 6 + Math.random() * 8,
      color: ['#f59e0b', '#16a34a', '#3b82f6', '#dc2626', '#a855f7', '#fff'][Math.floor(Math.random() * 6)],
      speed: 1.5 + Math.random() * 3,
      swing: Math.random() * 2 - 1,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 4,
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y += p.speed;
        p.x += p.swing * 0.4;
        p.angle += p.spin;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export default function WinnerScreen() {
  const { state, dispatch } = useTournament();
  const { players, config, payouts } = state;

  useEffect(() => {
    // Play victory sound
    const t = setTimeout(() => {
      try { playLevelUpChime(); } catch (_) {}
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const totalPlayers = players.length;
  const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0);
  const totalAddOns = players.reduce((sum, p) => sum + p.addOns, 0);
  const entryTotal  = totalPlayers * config.buyIn;
  const rebuyTotal  = totalRebuys  * config.rebuyAmount;
  const addOnTotal  = totalAddOns  * config.addOnAmount;
  const prizePool   = entryTotal + rebuyTotal + addOnTotal;

  const payoutList = prizePool > 0
    ? calculatePayouts(
        prizePool,
        totalPlayers,
        payouts.mode === 'custom' ? payouts.customSplit : null
      )
    : [];

  // Build sorted final standings
  const ranked = [...players].sort((a, b) => {
    const pa = a.finishPosition ?? 99999;
    const pb = b.finishPosition ?? 99999;
    return pa - pb;
  });

  const winner = ranked[0];

  const getPayout = (position) => {
    const entry = payoutList.find((p) => p.position === position);
    return entry ? entry.amount : 0;
  };

  const newTournament = () => dispatch({ type: 'RESET_TOURNAMENT' });

  return (
    <div className="winner-screen">
      <ConfettiCanvas />

      <div className="winner-content fade-in">
        {/* Header */}
        <div className="winner-header">
          <div className="trophy-icon">🏆</div>
          <h1 className="winner-headline">Tournament Complete!</h1>
          <p className="winner-subhead text-muted">{config.name}</p>
        </div>

        {/* Winner spotlight */}
        {winner && (
          <div className="winner-spotlight">
            <div className="spotlight-crown">👑</div>
            <div className="spotlight-name">{winner.name}</div>
            <div className="spotlight-label">Champion</div>
            {prizePool > 0 && (
              <div className="spotlight-prize">{formatMoney(getPayout(1))}</div>
            )}
          </div>
        )}

        {/* Prize pool summary */}
        {prizePool > 0 && (
          <div className="prize-summary card">
            <div className="prize-summary-row">
              <span>Prize Pool</span>
              <span className="text-gold font-bold">{formatMoney(prizePool)}</span>
            </div>
            <div className="prize-breakdown">
              <span>{totalPlayers} entries × {formatMoney(config.buyIn)}</span>
              {totalRebuys > 0 && <span>· {totalRebuys} rebuys × {formatMoney(config.rebuyAmount)}</span>}
              {totalAddOns > 0 && <span>· {totalAddOns} add-ons × {formatMoney(config.addOnAmount)}</span>}
            </div>
          </div>
        )}

        {/* Final standings */}
        <div className="standings card">
          <h2 className="standings-title">Final Standings</h2>
          <div className="standings-list">
            {ranked.map((p) => {
              const pos = p.finishPosition;
              const payout = getPayout(pos);
              return (
                <div
                  key={p.id}
                  className={`standing-row ${pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : ''}`}
                >
                  <div className="standing-pos">
                    {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : (
                      <span className="standing-pos-num">{pos}</span>
                    )}
                  </div>
                  <div className="standing-name">{p.name}</div>
                  <div className="standing-meta">
                    {p.rebuys > 0 && (
                      <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{p.rebuys}R</span>
                    )}
                    {p.addOns > 0 && (
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{p.addOns}A</span>
                    )}
                  </div>
                  <div className="standing-payout">
                    {payout > 0 ? (
                      <span className="payout-val">{formatMoney(payout)}</span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="winner-actions">
          <button className="btn-primary btn-lg new-btn" onClick={newTournament}>
            ♠ New Tournament
          </button>
        </div>
      </div>

      <style>{`
        .winner-screen {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }
        .winner-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .winner-header {
          text-align: center;
        }
        .trophy-icon {
          font-size: 4rem;
          line-height: 1;
          margin-bottom: 12px;
          filter: drop-shadow(0 0 20px #f59e0b);
        }
        .winner-headline {
          font-size: 2.2rem;
          font-weight: 900;
          color: var(--gold);
          margin-bottom: 4px;
        }
        .winner-subhead {
          font-size: 1rem;
        }
        .winner-spotlight {
          background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05));
          border: 2px solid var(--gold);
          border-radius: var(--radius-lg);
          padding: 32px;
          text-align: center;
          box-shadow: 0 0 40px rgba(245,158,11,0.2);
        }
        .spotlight-crown {
          font-size: 3rem;
          line-height: 1;
          margin-bottom: 8px;
        }
        .spotlight-name {
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--gold);
          margin-bottom: 4px;
        }
        .spotlight-label {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
          margin-bottom: 16px;
        }
        .spotlight-prize {
          font-size: 2rem;
          font-weight: 900;
          color: var(--green-light);
        }
        .prize-summary {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .prize-summary-row {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 1.05rem;
        }
        .prize-breakdown {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--muted);
        }
        .font-bold { font-weight: 800; }
        .standings {}
        .standings-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--gold);
          margin-bottom: 16px;
        }
        .standings-list { display: flex; flex-direction: column; gap: 6px; }
        .standing-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }
        .standing-row.pos-1 { border-color: #f59e0b; background: rgba(245,158,11,0.08); }
        .standing-row.pos-2 { border-color: #9ca3af; background: rgba(156,163,175,0.05); }
        .standing-row.pos-3 { border-color: #d97706; background: rgba(217,119,6,0.05); }
        .standing-pos { width: 36px; text-align: center; font-size: 1.3rem; flex-shrink: 0; }
        .standing-pos-num { font-size: 0.9rem; font-weight: 800; color: var(--muted); }
        .standing-name { flex: 1; font-weight: 700; min-width: 0; }
        .standing-meta { display: flex; gap: 4px; }
        .standing-payout { min-width: 80px; text-align: right; }
        .payout-val { font-weight: 900; color: var(--gold); font-size: 1rem; }
        .winner-actions { text-align: center; margin-top: 8px; }
        .new-btn { font-size: 1.15rem; padding: 16px 48px; }
      `}</style>
    </div>
  );
}
