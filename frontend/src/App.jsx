import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScanProvider } from './context/ScanProvider';
import { getHealth } from './api/client';
import { ShieldCheck, ScanSearch, Server, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

function DevHealthBanner() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div
      id="m1-dev-health-footer"
      className="mt-12 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-card backdrop-blur-sm max-w-2xl mx-auto"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Server className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            [Dev Only · M1] Backend Health Monitor
          </span>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-600 transition disabled:opacity-50"
          title="Refresh health check"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !health && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
          <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
          <span>Connecting to <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/health</code> via Vite proxy...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-rose-800">Connection Failed</p>
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {health && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              API Status: {health.status} ({health.service} v{health.version})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-400 block font-medium">Max Upload</span>
              <span className="font-semibold text-slate-800">
                {(health.limits.max_upload_bytes / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-400 block font-medium">Max Resolution</span>
              <span className="font-semibold text-slate-800">
                {health.limits.max_megapixels} MP
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-400 block font-medium">Token TTL</span>
              <span className="font-semibold text-slate-800">
                {health.limits.token_ttl_seconds / 60} mins
              </span>
            </div>
            <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
              <span className="text-slate-400 block font-medium">Active Sessions</span>
              <span className="font-semibold text-slate-800">
                {health.active_sessions}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeHero() {
  return (
    <div className="min-h-screen flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
      {/* Brand Header */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 shadow-sm">
            <ScanSearch className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Shadow<span className="text-amber-500">Trace</span>
            </span>
            <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Visual Privacy Guard
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3.5 py-1 text-xs font-semibold border border-amber-100">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Milestone 1 · Scaffold Active</span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="my-auto py-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold border border-amber-100 mb-6">
          Free · No account · Nothing stored
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.08] max-w-3xl">
          Know What Your Images <span className="text-amber-500">Reveal</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
          Every photo you take contains invisible metadata: GPS coordinates, device serial numbers, and timestamps. ShadowTrace scans and strips them with zero quality loss.
        </p>

        {/* Floating Preview Card */}
        <div className="mt-10 w-full max-w-xl rounded-3xl bg-white p-8 shadow-float border border-slate-100 transition hover:-translate-y-0.5">
          <div className="flex items-center justify-center gap-3 text-slate-700 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">AcademiX Design System Initialized</p>
              <p className="text-xs text-slate-500">Warm canvas (#FDFBF7) · Ambient glows · White floating cards</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
            Frontend (React 18 + Vite + Tailwind CSS) & Backend (Flask REST API) scaffolded successfully. M1 verification ready.
          </p>
        </div>

        {/* Live Health Monitor Footer */}
        <DevHealthBanner />
      </main>

      {/* Minimal Footer */}
      <footer className="text-center py-6 text-xs text-slate-400">
        ShadowTrace · Know what your images reveal · Ephemeral 10-minute lifecycle
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ScanProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WelcomeHero />} />
          <Route path="*" element={<WelcomeHero />} />
        </Routes>
      </BrowserRouter>
    </ScanProvider>
  );
}
