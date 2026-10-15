import React, { createContext, useContext, useState, useCallback } from 'react';

const ScanContext = createContext(null);

const initialState = {
  status: 'idle', // 'idle' | 'uploading' | 'analyzed' | 'cleaning' | 'cleaned' | 'error'
  file: null,
  token: null,
  analysis: null,
  cleanResult: null,
  error: null,
  expiresAt: null,
};

export function ScanProvider({ children }) {
  const [state, setState] = useState(initialState);

  const reset = useCallback(() => {
    // Revoke any object URLs if stored, reset in-memory state
    setState(initialState);
  }, []);

  const setError = useCallback((error) => {
    setState((prev) => ({
      ...prev,
      status: 'error',
      error,
    }));
  }, []);

  const value = {
    ...state,
    reset,
    setError,
  };

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
}
