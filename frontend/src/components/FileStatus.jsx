import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../utils/formatBytes';

export default function FileStatus({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    let url = null;
    try {
      url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-slate-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-slate-900 truncate"
              title={file.name}
            >
              {file.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium text-slate-500">
                {formatBytes(file.size)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                JPEG Ready
              </span>
            </div>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Remove selected file"
            aria-label="Remove selected image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
