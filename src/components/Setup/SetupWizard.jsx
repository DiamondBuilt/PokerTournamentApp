import React from 'react';
import { useTournament } from '../../context/TournamentContext';
import TournamentInfo from './TournamentInfo';
import PlayerSetup from './PlayerSetup';
import BlindStructureSetup from './BlindStructureSetup';
import ChipSetup from './ChipSetup';
import PayoutSetup from './PayoutSetup';
import ReviewSetup from './ReviewSetup';
import ThemePicker from '../ThemePicker';

const STEPS = [
  { label: 'Tournament Info', icon: '♠' },
  { label: 'Players',         icon: '♥' },
  { label: 'Blind Structure', icon: '♦' },
  { label: 'Chip Setup',      icon: '🎲' },
  { label: 'Payouts',         icon: '♣' },
  { label: 'Review & Start',  icon: '🏆' },
];

export default function SetupWizard() {
  const { state, dispatch } = useTournament();
  const step = state.setupStep;

  const goTo = (s) => dispatch({ type: 'SET_SETUP_STEP', payload: s });
  const next = () => goTo(Math.min(step + 1, STEPS.length - 1));
  const prev = () => goTo(Math.max(step - 1, 0));

  const renderStep = () => {
    switch (step) {
      case 0: return <TournamentInfo      onNext={next} />;
      case 1: return <PlayerSetup         onNext={next} onPrev={prev} />;
      case 2: return <BlindStructureSetup onNext={next} onPrev={prev} />;
      case 3: return <ChipSetup           onNext={next} onPrev={prev} />;
      case 4: return <PayoutSetup         onNext={next} onPrev={prev} />;
      case 5: return <ReviewSetup         onPrev={prev} />;
      default: return null;
    }
  };

  return (
    <div className="setup-wizard fade-in">
      {/* Header */}
      <header className="setup-header">
        <div className="setup-logo">
          <span className="logo-suit">♠</span>
          <span className="logo-text">Poker Tournament Director</span>
        </div>
        <ThemePicker />
      </header>

      {/* Step Progress */}
      <div className="setup-progress">
        {STEPS.map((s, i) => (
          <button
            key={i}
            className={`step-pill ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => i < step && goTo(i)}
            style={{ cursor: i < step ? 'pointer' : 'default' }}
          >
            <span className="step-icon">{i < step ? '✓' : s.icon}</span>
            <span className="step-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="setup-content">
        {renderStep()}
      </main>

      <style>{`
        .setup-wizard {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          padding-top: env(safe-area-inset-top);
        }
        .setup-header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 16px max(32px, env(safe-area-inset-right, 0px));
          padding-left: max(32px, env(safe-area-inset-left, 0px));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .setup-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-suit {
          font-size: 2rem;
          line-height: 1;
        }
        .logo-text {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: -0.02em;
        }
        .setup-progress {
          display: flex;
          gap: 8px;
          padding: 20px 32px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .setup-progress::-webkit-scrollbar { display: none; }
        .step-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .step-pill.done {
          background: rgba(22,163,74,0.15);
          border-color: var(--green);
          color: var(--green-light);
        }
        .step-pill.active {
          background: rgba(245,158,11,0.15);
          border-color: var(--gold);
          color: var(--gold);
        }
        .step-icon { font-size: 0.9rem; }
        .setup-content {
          flex: 1;
          padding: 32px;
          padding-bottom: max(32px, env(safe-area-inset-bottom, 0px));
          max-width: 860px;
          margin: 0 auto;
          width: 100%;
        }
        @media (max-width: 640px) {
          .setup-content { padding: 20px 16px; padding-bottom: max(20px, env(safe-area-inset-bottom, 0px)); }
          .setup-progress { padding: 12px 16px; }
          .step-label { display: none; }
        }
      `}</style>
    </div>
  );
}
