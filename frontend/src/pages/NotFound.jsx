import React from 'react';
import { Link } from 'react-router-dom';
import { ScanSearch, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 sm:py-28 max-w-xl mx-auto px-4 text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
        <ScanSearch className="h-8 w-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold border border-slate-200">
        404 · Page Not Found
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
        Lost in the Shadows?
      </h1>

      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
        The page you are looking for does not exist or may have been moved. Everything we do is ephemeral and privacy-first!
      </p>

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 shadow-[0_10px_20px_-8px_rgba(217,119,6,0.55)] transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Overview</span>
        </Link>
      </div>
    </div>
  );
}
