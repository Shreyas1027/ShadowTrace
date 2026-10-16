import React from 'react';
import { Link } from 'react-router-dom';
import IconBadge from '../components/IconBadge';
import {
  MapPin,
  ShieldCheck,
  Timer,
  ArrowRight,
  UploadCloud,
  Search,
  AlertTriangle,
  Clock,
  Smartphone,
  EyeOff,
  Sparkles,
  ShieldAlert,
  Camera,
  CheckCircle2,
} from 'lucide-react';

function MetadataPreviewCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-float p-6 sm:p-7 relative transition duration-200 hover:-translate-y-0.5">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/60">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">IMG_4821.JPG</span>
              <span className="text-[11px] text-slate-400 font-mono">3.4 MB</span>
            </div>
            <p className="text-[11px] text-slate-500">Live Metadata Inspection Preview</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-xs font-semibold border border-rose-100">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          High Risk Detected
        </span>
      </div>

      {/* Simulated Metadata Tags */}
      <div className="space-y-3">
        {/* Tag 1: GPS Coordinates */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">GPS Coordinates</span>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded font-semibold">
                  EXIF GPS
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600 truncate mt-0.5">
                47.6204° N, 122.3494° W · 56.4 m
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-rose-700 bg-white px-2.5 py-1 rounded-full border border-rose-100 shadow-2xs">
            Exposes Address
          </span>
        </div>

        {/* Tag 2: Capture Timestamp */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">DateTimeOriginal</span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded font-semibold">
                  Capture Time
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600 truncate mt-0.5">
                2026-10-12 18:41:07 UTC
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-amber-800 bg-white px-2.5 py-1 rounded-full border border-amber-100 shadow-2xs">
            Reveals Routine
          </span>
        </div>

        {/* Tag 3: Hardware Signature */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">Camera Device</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded font-semibold">
                  Hardware
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600 truncate mt-0.5">
                Apple iPhone 15 Pro · iOS 17.5.1
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
            Device Fingerprint
          </span>
        </div>
      </div>

      {/* Bottom Stripping Action Callout */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>ShadowTrace strips all 14 embedded tags losslessly</span>
        </div>

        <Link
          to="/scanner"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition"
        >
          <span>Try on yours</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="space-y-20 lg:space-y-28 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Headline, Description, Prominent CTA, Benefit Cards */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3.5 py-1 text-xs font-semibold border border-amber-100 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              Free · No account · Nothing stored
            </div>

            {/* Two-tone Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05]">
              Know What Your Images <span className="text-amber-500">Reveal</span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Every photo you take embeds hidden metadata—GPS coordinates, device serial numbers, and exact timestamps. ShadowTrace detects and strips them with zero quality loss before you share.
            </p>

            {/* Prominent CTA Button to /scanner */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                to="/scanner"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-4 shadow-[0_10px_20px_-8px_rgba(217,119,6,0.55)] transition duration-150 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 text-base group"
              >
                <span>Launch Image Scanner</span>
                <ArrowRight className="h-5 w-5 transition duration-150 group-hover:translate-x-1" />
              </Link>

              <Link
                to="/guide"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-4 font-semibold text-sm shadow-sm transition"
              >
                <span>Read Privacy Guide</span>
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              No account required · In-memory temporary analysis · Ephemeral 10-minute auto purge
            </p>

            {/* Row / Grid of 3 Benefit Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex flex-col gap-3 transition hover:-translate-y-0.5">
                <IconBadge icon={MapPin} variant="amber" size="sm" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Find hidden GPS</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Detect exact latitude, longitude, and elevation embedded in EXIF tags.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex flex-col gap-3 transition hover:-translate-y-0.5">
                <IconBadge icon={ShieldCheck} variant="emerald" size="sm" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Clean without quality loss</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Strip invasive metadata while leaving pixel data 100% bit-for-bit intact.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex flex-col gap-3 transition hover:-translate-y-0.5">
                <IconBadge icon={Timer} variant="indigo" size="sm" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Deleted in 10 minutes</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Automatic memory cleanup and cryptographic purge of temporary tokens.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Illustrative Card showing what metadata looks like */}
          <div className="lg:col-span-5 w-full">
            <MetadataPreviewCard />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 mb-3">
            Simple 3-Step Privacy
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            How ShadowTrace Works
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Protect your visual privacy in seconds with zero configuration or complex software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col items-start relative transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between w-full mb-4">
              <IconBadge icon={UploadCloud} variant="amber" />
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                Step 01
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Upload Image</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Drag and drop any JPEG photo into the dedicated Scanner. We inspect raw segments in memory without writing your file to a database.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col items-start relative transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between w-full mb-4">
              <IconBadge icon={Search} variant="indigo" />
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                Step 02
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Review Risk</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              See what your photo reveals: exact GPS coordinates, timestamps, camera serials, and an overall privacy risk rating.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col items-start relative transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between w-full mb-4">
              <IconBadge icon={ShieldCheck} variant="emerald" />
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                Step 03
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. Clean & Verify</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Strip all tracking metadata losslessly. Our byte verifier proves no sensitive tags remain before you download.
            </p>
          </div>
        </div>
      </section>

      {/* Why It Matters Banner Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-50 to-white p-8 sm:p-12 border border-amber-100/80 shadow-card">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs tracking-wider uppercase">
                <AlertTriangle className="h-4 w-4" />
                <span>Why Visual Privacy Matters</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Photos posted online can reveal your home address and daily habits.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                When you share a photo of your pet, yard, or workplace on classifieds, forums, or messaging apps, GPS coordinates can pinpoint your exact street address. Learn how location data leaks and how to secure your devices.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Link
                to="/scanner"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 font-semibold text-sm shadow-sm transition"
              >
                <span>Launch Scanner</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/guide"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-5 py-3 font-semibold text-sm shadow-sm transition"
              >
                <span>Read Privacy Guide</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
