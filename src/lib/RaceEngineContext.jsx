import React, { createContext, useContext } from 'react';
import { useRaceEngineLogic } from '@/hooks/useRaceEngine';

const RaceEngineContext = createContext(null);

export function RaceEngineProvider({ children }) {
  // Single control instance drives lap generation globally so it persists
  // across page navigation (pit → lap timing → driver HUD).
  const engine = useRaceEngineLogic({ control: true });
  return (
    <RaceEngineContext.Provider value={engine}>
      {children}
    </RaceEngineContext.Provider>
  );
}

export function useRaceEngine() {
  const ctx = useContext(RaceEngineContext);
  if (!ctx) throw new Error('useRaceEngine must be used within RaceEngineProvider');
  return ctx;
}