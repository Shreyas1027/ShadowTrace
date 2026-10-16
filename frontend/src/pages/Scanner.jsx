import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScan } from '../context/ScanProvider';
import UploadZone from '../components/UploadZone';
import FileStatus from '../components/FileStatus';
import ErrorBanner from '../components/ErrorBanner';
import { Camera, ArrowRight, Lock, RefreshCw, ShieldCheck, Info } from 'lucide-react';

export default function Scanner() {
  const navigate = useNavigate();
  const { file, status, error, selectFile, removeFile, clearError, startAnalyze } = useScan();
  const isAnalyzing = status === 'uploading';

  const handleAnalyze = async () => {
    try {
      const result = await startAnalyze();
      if (result) {
        navigate('/results');
      }
    } catch {
      // Error handled in context state
    }
  };

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-3.5 py-1 text-xs font-semibold border border-amber-100 mb-3">
          <Camera className="h-3.5 w-3.5 text-amber-500" />
          <span>Focused Upload Workspace</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
          Image Scanner
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
          Upload any JPEG photo to reveal embedded GPS coordinates, camera specs, timestamps, and hidden tracking segments.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-float p-6 sm:p-8 transition">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                In-Memory Session
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Max 10 MB · JPEG
            </span>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorBanner error={error} onDismiss={clearError} />
            </div>
          )}

          <div className="space-y-4">
            {!file ? (
              <UploadZone onFileSelected={selectFile} disabled={isAnalyzing} />
            ) : (
              <div className="space-y-3">
                <FileStatus file={file} onRemove={isAnalyzing ? null : removeFile} />
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Photo selected and ready</span>
                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={isAnalyzing}
                    className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
                  >
                    Choose another photo
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3.5 shadow-[0_10px_20px_-8px_rgba(217,119,6,0.55)] transition duration-150 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-white" />
                  <span>Analyzing Image…</span>
                </>
              ) : (
                <>
                  <span>Analyze Image</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Your photo is processed in memory-safe temporary storage and deleted within 10 minutes.</span>
            </div>
          </div>
        </div>

        {/* Informative Guidance note */}
        <div className="mt-8 rounded-2xl bg-white/70 border border-slate-100 p-4 shadow-card flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Info className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700">What happens after analysis?</strong> You will review an interactive breakdown of every metadata tag found (GPS location on a map, camera serials, timestamps) and have the option to losslessly scrub all tags.
          </p>
        </div>
      </div>
    </div>
  );
}
