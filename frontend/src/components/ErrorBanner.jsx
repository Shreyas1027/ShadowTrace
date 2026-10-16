import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ error, onDismiss, className = '' }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const code = typeof error === 'object' ? error.code : null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`flex items-start justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/90 p-4 text-rose-800 shadow-sm transition ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-rose-900">
            {code ? 'Notice' : 'Upload Error'}
          </p>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          className="text-rose-400 hover:text-rose-700 p-1 rounded-lg transition"
          aria-label="Dismiss error notice"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
