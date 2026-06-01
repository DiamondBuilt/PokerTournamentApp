import { useEffect, useRef, useCallback } from 'react';
import { useTournament } from '../context/TournamentContext';
import { playAlertForTime, playLevelUpChime, playBreakChime } from '../utils/audioManager';

export function useTimer() {
  const { state, dispatch } = useTournament();
  const intervalRef = useRef(null);
  // Track the real wall-clock time of the last tick so backgrounded tabs stay accurate
  const lastTickAt = useRef(null);
  const { tournament, structure } = state;

  const isRunning = tournament.status === 'playing' || tournament.status === 'break';
  const isBreak = tournament.status === 'break';

  const tick = useCallback(() => {
    const now = Date.now();
    // Calculate actual elapsed seconds since last tick (handles background throttling)
    const elapsed = lastTickAt.current ? Math.round((now - lastTickAt.current) / 1000) : 1;
    lastTickAt.current = now;

    const { tournament, structure } = state;
    const isBreak = tournament.status === 'break';
    const timeKey = isBreak ? 'breakTimeRemaining' : 'timeRemaining';
    const current = tournament[timeKey];
    const next = Math.max(0, current - elapsed);

    // Play audio alerts based on the new time value (only during play, not breaks).
    // Pass the previous value too so a threshold skipped by a throttled
    // background tab still fires when it catches up.
    if (!isBreak) {
      playAlertForTime(next, current);
    }

    if (next <= 0) {
      if (isBreak) {
        playLevelUpChime();
        dispatch({ type: 'END_BREAK' });
      } else {
        const shouldBreak =
          structure.breakLevels && structure.breakLevels.includes(tournament.currentLevel);
        const hasNextLevel = tournament.currentLevel + 1 <= structure.levels.length;

        if (shouldBreak && hasNextLevel) {
          playBreakChime();
          dispatch({ type: 'START_BREAK' });
        } else {
          playLevelUpChime();
          dispatch({ type: 'ADVANCE_LEVEL' });
        }
      }
    } else {
      dispatch({ type: 'TICK', payload: { isBreak, elapsed } });
    }
  }, [state, dispatch]);

  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (isRunning) {
      lastTickAt.current = Date.now();
      intervalRef.current = setInterval(() => tickRef.current(), 1000);
    } else {
      lastTickAt.current = null;
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
