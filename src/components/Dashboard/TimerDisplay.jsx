import React from 'react';
import { useTimer } from '../../hooks/useTimer';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function TimerDisplay() {
  const { timeRemaining, isBreak } = useTimer();

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const display = `${pad(minutes)}:${pad(seconds)}`;

  let colorClass = 'timer-green';
  let pulseClass = '';

  if (isBreak) {
    colorClass = 'timer-blue';
  } else if (timeRemaining < 60) {
    colorClass = 'timer-red';
    pulseClass = 'pulse-red';
  } else if (timeRemaining < 300) {
    colorClass = 'timer-amber';
  }

  return (
    <div className={`timer-display ${colorClass} ${pulseClass}`}>
      {display}
      <style>{`
        .timer-display {
          font-size: clamp(5rem, 16vw, 10rem);
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          font-family: 'Courier New', Courier, monospace;
          letter-spacing: 0.04em;
          line-height: 1;
          text-shadow: 0 0 40px currentColor;
          user-select: none;
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .timer-display {
            font-size: clamp(3rem, 12vh, 6rem);
          }
        }
        .timer-green { color: #22c55e; }
        .timer-amber { color: #f59e0b; }
        .timer-red   { color: #ef4444; }
        .timer-blue  { color: #60a5fa; }
      `}</style>
    </div>
  );
}
