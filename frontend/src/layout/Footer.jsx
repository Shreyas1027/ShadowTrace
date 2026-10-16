import React from 'react';
import { Link } from 'react-router-dom';
import { ScanSearch, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-sm mt-auto py-10 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Link
              to="/"
              className="flex items-center gap-2 group outline-none"
              aria-label="ShadowTrace Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                <ScanSearch className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Shadow<span className="text-amber-500">Trace</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-slate-300">|</span>
            <p className="text-xs text-slate-500 max-w-md">
              Visual Privacy Guard · Know what your images reveal · Ephemeral 10-minute lifecycle
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <Link
              to="/scanner"
              className="hover:text-slate-900 transition"
            >
              Image Scanner
            </Link>
            <Link
              to="/guide"
              className="hover:text-slate-900 transition"
            >
              Privacy Guide
            </Link>
            <Link
              to="/about"
              className="hover:text-slate-900 transition"
            >
              About
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Zero database storage. No tracking cookies or advertising pixels.</span>
          </div>
          <div>
            © {new Date().getFullYear()} ShadowTrace. Open visual privacy standard.
          </div>
        </div>
      </div>
    </footer>
  );
}
