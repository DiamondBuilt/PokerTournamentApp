import { useEffect, useRef, useCallback } from 'react';
import { useTournament } from '../context/TournamentContext';
import { playAlertForTime, playLevelUpChime, playBreakChime } from '../utils/audioManager';

export function useTimer() {
  const { state, dispatch } = useTournament();
  const intervalRef = useRef(null);
  const { tournament, structure } = state;

  const isRunning = tournament.status === 'playing' || tournament.status === 'break';
  const isBreak = tournament.status === 'break';

  const tick = useCallback(() => {
    const { tournament, structure } = state;
    const isBreak = tournament.status === 'break';
    const timeKey = isBreak ? 'breakTimeRemaining' : 'timeRemaining';
    const current = tournament[timeKey];

    // Play audio alerts
    if (!isBreak) {
      playAlertForTime(current);
    }

    if (current <= 1) {
      // Time's up
      if (isBreak) {
        // Break ended -> resume playing
        playLevelUpChime();
        dispatch({ type: 'END_BREAK' });
      } else {
        // Level ended -> check if next is a break
        const nextLevel = tournament.currentLevel + 1;
        const isBreakNext = structure.breakLevels && structure.breakLevels.includes(nextLevel - 1);
        // breakLevels contains the level number AFTER which break occurs
        const shouldBreak = structure.breakLevels && structure.breakLevels.includes(tournament.currentLevel);

        if (shouldBreak && nextLevel <= structure.levels.length) {
          playBreakChime();
          dispatch({ type: 'START_BREAK' });
        } else {
          playLevelUpChime();
          dispatch({ type: 'ADVANCE_LEVEL' });
        }
      }
    } else {
      dispatch({ type: 'TICK', payload: { isBreak } });
    }
  }, [state, dispatch]);

  // We use a ref to always have the latest tick fn without re-creating the interval
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tickRef.current();
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [dispatch]);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), [dispatch]);
  const advanceLevel = useCallback(() => {
    playLevelUpChime();
    dispatch({ type: 'ADVANCE_LEVEL' });
  }, [dispatch]);
  const previousLevel = useCallback(() => dispatch({ type: 'PREVIOUS_LEVEL' }), [dispatch]);

  return {
    timeRemaining: isBreak ? tournament.breakTimeRemaining : tournament.timeRemaining,
    isRunning,
    isBreak,
    pause,
    resume,
    advanceLevel,
    previousLevel,
  };
}
