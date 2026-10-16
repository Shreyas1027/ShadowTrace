import React from 'react';
import { Link } from 'react-router-dom';
import IconBadge from '../components/IconBadge';
import {
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Timer,
  FileCheck,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function About() {
  return (
    <div className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">
      {/* Mission Hero */}
      <section className="max-w-3xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3.5 py-1 text-xs font-semibold border border-amber-100 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Our Core Mission</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
          Protecting visual privacy before you share
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Modern smartphones record far more than light and color. Hidden within every photo file are precision GPS coordinates, device serial numbers, and exact timestamps. ShadowTrace exists to make visual privacy accessible, transparent, and instantaneous for everyone.
        </p>
      </section>

      {/* 4 Feature Cards per FR-NAV-06 */}
      <section>
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Built on Uncompromising Privacy Principles
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Every layer of our architecture is designed to safeguard your confidentiality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Private by design */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-7 flex flex-col justify-between transition hover:-translate-y-0.5">
            <div>
              <div className="mb-4">
                <IconBadge icon={EyeOff} variant="amber" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Private by design</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We do not maintain user databases, persistent storage, or user tracking profiles. Your photos are buffered strictly in temporary memory sessions and wiped automatically.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-amber-700 flex items-center gap-1.5">
              <span>Zero logs · Zero tracking profiles</span>
            </div>
          </div>

          {/* Card 2: Lossless cleaning */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-7 flex flex-col justify-between transition hover:-translate-y-0.5">
            <div>
              <div className="mb-4">
                <IconBadge icon={ShieldCheck} variant="emerald" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Lossless cleaning</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Unlike screenshotting or aggressive social media recompression, our metadata scrubber cleanly excises hidden tracking tags while leaving every single image pixel and color profile completely intact.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <span>Bit-for-bit pixel preservation</span>
            </div>
          </div>

          {/* Card 3: Verified results */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-7 flex flex-col justify-between transition hover:-translate-y-0.5">
            <div>
              <div className="mb-4">
                <IconBadge icon={CheckCircle2} variant="indigo" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verified results</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Trust requires proof. Every sanitized image undergoes an automated second-pass byte inspection to guarantee zero GPS tags, serial identifiers, or timestamps linger before you download.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
              <span>Dual-pass cryptographic verification</span>
            </div>
          </div>

          {/* Card 4: No accounts or tracking */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-7 flex flex-col justify-between transition hover:-translate-y-0.5">
            <div>
              <div className="mb-4">
                <IconBadge icon={Lock} variant="rose" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No accounts or tracking</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                You will never be asked for an email address, password, or credit card. We embed zero third-party advertising cookies, zero analytics beacons, and share nothing with data brokers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-rose-700 flex items-center gap-1.5">
              <span>Free for everyone · 100% anonymous</span>
            </div>
          </div>
        </div>
      </section>

      {/* How we treat your photos */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-12">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 mb-2">
            Photo Safety Policy
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How We Treat Your Photos
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            We operate under a strict, verifiable privacy protocol for every file processed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Timer className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">10-Minute Ephemeral TTL</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every upload starts an automatic 10-minute countdown. Upon expiration, all session memory and temporary storage are immediately overwritten.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant Purge on Reset</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you close the browser tab, click remove, or start a new scan, your session token is marked deleted and purged right away.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Model Training</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your photographs are never scanned for facial recognition, advertising profiling, or used as training data for machine learning models.
            </p>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Encrypted in Transit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All communications between your device and our processing engines use modern cryptographic transport security protocols.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="text-center pt-4">
        <Link
          to="/scanner"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-4 shadow-[0_10px_20px_-8px_rgba(217,119,6,0.55)] transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 text-base"
        >
          <span>Open Image Scanner</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </div>
  );
}
