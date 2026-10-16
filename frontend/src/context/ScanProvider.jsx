import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { analyzeImage, deleteSession } from '../api/client';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

const ScanContext = createContext(null);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

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
  const currentTokenRef = useRef(null);

  // Validate file client-side before accepting it
  const validateFile = useCallback((file) => {
    if (!file) {
      return {
        code: 'NO_FILE',
        message: getFriendlyErrorMessage('NO_FILE'),
      };
    }

    const name = file.name ? file.name.toLowerCase() : '';
    const isJpegExt = name.endsWith('.jpg') || name.endsWith('.jpeg');
    const isJpegType = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === '';

    if (!isJpegExt && !isJpegType) {
      return {
        code: 'UNSUPPORTED_TYPE',
        message: getFriendlyErrorMessage('UNSUPPORTED_TYPE'),
      };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        code: 'FILE_TOO_LARGE',
        message: getFriendlyErrorMessage('FILE_TOO_LARGE'),
      };
    }

    return null;
  }, []);

  const selectFile = useCallback((file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setState((prev) => ({
        ...prev,
        error: validationError,
        status: 'error',
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      file,
      error: null,
      status: 'idle',
    }));
    return true;
  }, [validateFile]);

  const removeFile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      file: null,
      error: null,
      status: 'idle',
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      status: prev.file ? 'idle' : 'idle',
    }));
  }, []);

  const setError = useCallback((error) => {
    const errorObj = typeof error === 'string'
      ? { code: 'CUSTOM_ERROR', message: error }
      : {
          code: error?.code || 'UNKNOWN_ERROR',
          message: error?.message || getFriendlyErrorMessage(error?.code),
        };

    setState((prev) => ({
      ...prev,
      status: 'error',
      error: errorObj,
    }));
  }, []);

  const startAnalyze = useCallback(async (fileOverride = null) => {
    const targetFile = fileOverride || state.file;

    const validationError = validateFile(targetFile);
    if (validationError) {
      setState((prev) => ({
        ...prev,
        error: validationError,
        status: 'error',
      }));
      return null;
    }

    setState((prev) => ({
      ...prev,
      status: 'uploading',
      error: null,
    }));

    try {
      const data = await analyzeImage(targetFile);
      currentTokenRef.current = data.token;

      const ttlMs = (data.ttl_seconds || 600) * 1000;
      const expiresAt = Date.now() + ttlMs;

      setState((prev) => ({
        ...prev,
        status: 'analyzed',
        file: targetFile,
        token: data.token,
        analysis: data,
        expiresAt,
        error: null,
      }));

      return data;
    } catch (err) {
      const code = err.code || 'UNKNOWN_ERROR';
      const friendlyMessage = getFriendlyErrorMessage(code, err.message);

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: {
          code,
          message: friendlyMessage,
        },
      }));
      throw err;
    }
  }, [state.file, validateFile]);

  const reset = useCallback(() => {
    if (currentTokenRef.current) {
      deleteSession(currentTokenRef.current);
      currentTokenRef.current = null;
    }
    setState(initialState);
  }, []);

  const value = {
    ...state,
    selectFile,
    removeFile,
    clearError,
    setError,
    startAnalyze,
    reset,
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
