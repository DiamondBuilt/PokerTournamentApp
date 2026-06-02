import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { BLIND_TEMPLATES } from '../utils/blindStructures';
import { applyTheme } from '../utils/themes';

const TournamentContext = createContext(null);

const DEFAULT_STRUCTURE = BLIND_TEMPLATES.standard;

export const initialState = {
  config: {
    name: 'My Poker Tournament',
    date: new Date().toISOString().split('T')[0],
    buyIn: 100,
    rebuyEnabled: false,
    rebuyAmount: 100,
    rebuyChips: 10000,
    maxRebuys: 2,
    rebuyLevelLimit: 4,
    addOnEnabled: false,
    addOnAmount: 100,
    addOnChips: 10000,
    addOnLevel: 6,
  },
  structure: {
    template: 'standard',
    startingChips: DEFAULT_STRUCTURE.startingChips,
    levelDuration: DEFAULT_STRUCTURE.levelDuration,
    breakDuration: DEFAULT_STRUCTURE.breakDuration,
    levels: DEFAULT_STRUCTURE.levels,
    breakLevels: DEFAULT_STRUCTURE.breakLevels,
  },
  players: [],
  payouts: {
    mode: 'auto',
    customSplit: [],
  },
  chipConfig: {
    denominations: [5, 25, 100, 500, 1000],
  },
  theme: 'dark',
  tournament: {
    phase: 'setup',
    status: 'paused',
    currentLevel: 1,
    timeRemaining: DEFAULT_STRUCTURE.levelDuration,
    breakTimeRemaining: DEFAULT_STRUCTURE.breakDuration,
    startTime: null,
    eliminationOrder: [],
  },
  setupStep: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SETUP_STEP':
      return { ...state, setupStep: action.payload };

    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };

    case 'UPDATE_STRUCTURE': {
      const updates = action.payload;
      const newStructure = { ...state.structure, ...updates };
      return {
        ...state,
        structure: newStructure,
        tournament: {
          ...state.tournament,
          timeRemaining: newStructure.levelDuration,
          breakTimeRemaining: newStructure.breakDuration,
        },
      };
    }

    case 'ADD_PLAYER': {
      const newPlayer = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        seat: action.payload.seat || state.players.length + 1,
        rebuys: 0,
        addOns: 0,
        status: 'active',
        finishPosition: null,
        eliminatedLevel: null,
      };
      return { ...state, players: [...state.players, newPlayer] };
    }

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.payload),
      };

    case 'UPDATE_PLAYER': {
      const updated = state.players.map((p) =>
        p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
      );
      return { ...state, players: updated };
    }

    case 'ELIMINATE_PLAYER': {
      const { playerId, position } = action.payload;
      const activePlayers = state.players.filter((p) => p.status === 'active');
      const finishPos = position || activePlayers.length;
      const updatedPlayers = state.players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              status: 'eliminated',
              finishPosition: finishPos,
              eliminatedLevel: state.tournament.currentLevel,
            }
          : p
      );
      const newOrder = [...state.tournament.eliminationOrder, playerId];

      // Check if only 1 active player remains -> tournament complete
      const stillActive = updatedPlayers.filter((p) => p.status === 'active');
      if (stillActive.length === 1) {
        const winner = stillActive[0];
        const finalPlayers = updatedPlayers.map((p) =>
          p.id === winner.id ? { ...p, finishPosition: 1 } : p
        );
        return {
          ...state,
          players: finalPlayers,
          tournament: {
            ...state.tournament,
            status: 'paused',
            phase: 'complete',
            eliminationOrder: newOrder,
          },
        };
      }

      return {
        ...state,
        players: updatedPlayers,
        tournament: {
          ...state.tournament,
          eliminationOrder: newOrder,
        },
      };
    }

    case 'REBUY_PLAYER': {
      const updated = state.players.map((p) =>
        p.id === action.payload
          ? { ...p, rebuys: p.rebuys + 1, status: 'active' }
          : p
      );
      return { ...state, players: updated };
    }

    case 'ADDON_PLAYER': {
      const updated = state.players.map((p) =>
        p.id === action.payload ? { ...p, addOns: p.addOns + 1 } : p
      );
      return { ...state, players: updated };
    }

    case 'UPDATE_CHIP_CONFIG':
      return { ...state, chipConfig: { ...state.chipConfig, ...action.payload } };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'UPDATE_PAYOUTS':
      return { ...state, payouts: { ...state.payouts, ...action.payload } };

    case 'START_TOURNAMENT':
      return {
        ...state,
        tournament: {
          ...state.tournament,
          phase: 'running',
          status: 'playing',
          currentLevel: 1,
          timeRemaining: state.structure.levelDuration,
          breakTimeRemaining: state.structure.breakDuration,
          startTime: Date.now(),
          eliminationOrder: [],
        },
      };

    case 'PAUSE':
      return {
        ...state,
        tournament: { ...state.tournament, status: 'paused' },
      };

    case 'RESUME':
      return {
        ...state,
        tournament: { ...state.tournament, status: 'playing' },
      };

    case 'TICK': {
      const { isBreak, elapsed = 1 } = action.payload;
      if (isBreak) {
        return {
          ...state,
          tournament: {
            ...state.tournament,
            breakTimeRemaining: Math.max(0, state.tournament.breakTimeRemaining - elapsed),
          },
        };
      }
      return {
        ...state,
        tournament: {
          ...state.tournament,
          timeRemaining: Math.max(0, state.tournament.timeRemaining - elapsed),
        },
      };
    }

    case 'ADVANCE_LEVEL': {
      const nextLevel = Math.min(
        state.tournament.currentLevel + 1,
        state.structure.levels.length
      );
      return {
        ...state,
        tournament: {
          ...state.tournament,
          currentLevel: nextLevel,
          timeRemaining: state.structure.levelDuration,
          status: 'playing',
        },
      };
    }

    case 'PREVIOUS_LEVEL': {
      const prevLevel = Math.max(1, state.tournament.currentLevel - 1);
      return {
        ...state,
        tournament: {
          ...state.tournament,
          currentLevel: prevLevel,
          timeRemaining: state.structure.levelDuration,
          status: 'paused',
        },
      };
    }

    case 'START_BREAK':
      return {
        ...state,
        tournament: {
          ...state.tournament,
          status: 'break',
          breakTimeRemaining: state.structure.breakDuration,
        },
      };

    case 'END_BREAK':
      return {
        ...state,
        tournament: {
          ...state.tournament,
          status: 'playing',
          currentLevel: Math.min(
            state.tournament.currentLevel + 1,
            state.structure.levels.length
          ),
          timeRemaining: state.structure.levelDuration,
        },
      };

    case 'RESET_TOURNAMENT':
      return {
        ...initialState,
        config: state.config,
        chipConfig: state.chipConfig,
        theme: state.theme,
      };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

const STORAGE_KEY = 'pokerTournamentState';

export function TournamentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Apply saved theme immediately to avoid flash-of-default on reload
        if (parsed.theme) applyTheme(parsed.theme);
        // Merge with init to ensure new fields (chipConfig, theme) exist for old saves
        return {
          ...init,
          ...parsed,
          chipConfig: parsed.chipConfig ?? init.chipConfig,
          theme: parsed.theme ?? init.theme,
          tournament: {
            ...parsed.tournament,
            status:
              parsed.tournament.status === 'playing' ? 'paused' : parsed.tournament.status,
          },
        };
      }
    } catch (e) {
      // ignore
    }
    return init;
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore storage errors
    }
  }, [state]);

  return (
    <TournamentContext.Provider value={{ state, dispatch }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used inside TournamentProvider');
  return ctx;
}
