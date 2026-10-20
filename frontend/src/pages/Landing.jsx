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

function InteractiveScannerVisual() {
  return (
    <Link
      to="/scanner"
      className="group block bg-white rounded-3xl border border-slate-100 shadow-float p-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100/60 shadow-2xs">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">IMG_4821.JPG</span>
              <span className="text-[10px] text-slate-400 font-mono">3.4 MB · 4032×3024</span>
            </div>
            <p className="text-[10px] text-slate-500">Live Metadata Detection HUD</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-[11px] font-semibold border border-rose-100">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          High Risk Detected
        </span>
      </div>

      {/* Image Showcase Container with Laser Beam and HUD Badges */}
      <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 shadow-inner">
        {/* High-quality scenic photo (Seattle skyline with Space Needle matching GPS coordinates) */}
        <img
          src="https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1000&q=80"
          alt="Seattle Space Needle photo with embedded privacy metadata"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-[0.92]"
          loading="eager"
        />

        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/40 pointer-events-none" />

        {/* Dynamic Glowing Amber Scan Beam (Continuous CSS Animation) */}
        <div className="absolute left-0 right-0 z-20 pointer-events-none animate-scan-laser">
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
          <div className="h-14 w-full bg-gradient-to-b from-amber-400/10 to-transparent -translate-y-full" />
        </div>

        {/* Overlay Privacy Pin 1: Timestamp Chip (Top Right) */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20 shadow-md text-[11px] font-mono">
            <Clock className="h-3 w-3 text-amber-400 shrink-0" />
            <span>🕒 Oct 12, 18:41 UTC</span>
          </div>
        </div>

        {/* Overlay Privacy Pin 2: Pulsing Red GPS Tag in Center with Radar-Ping Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center">
          {/* Radar Ping Target */}
          <div className="relative flex items-center justify-center mb-1.5">
            <span className="absolute h-9 w-9 rounded-full bg-rose-500/40 animate-ping" />
            <span className="absolute h-6 w-6 rounded-full bg-rose-500/20" />
            <span className="relative flex h-3.5 w-3.5 rounded-full bg-rose-600 border-2 border-white shadow-lg items-center justify-center" />
          </div>

          {/* GPS Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md text-white border border-rose-500/60 shadow-xl text-[11px] font-mono whitespace-nowrap">
            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span className="font-semibold text-rose-100">📍 47.6204° N, 122.3494° W</span>
            <span className="text-slate-400 font-sans font-normal">(Seattle, WA)</span>
          </div>
        </div>

        {/* Overlay Privacy Pin 3: Glassmorphic Tag (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-white border border-white/20 shadow-lg text-[11px]">
            <Camera className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-100">📷 Apple iPhone 15 Pro</span>
            <span className="text-slate-400 font-mono text-[10px]">· 24mm f/1.78</span>
          </div>
        </div>

        {/* Interactive Hover Overlay: Smooth Transition Badge */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-center justify-center backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs shadow-2xl transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
            <span>Click to test your own photo</span>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Real-time EXIF detection & lossless scrubbing</span>
        </div>
        <span className="text-[11px] font-semibold text-amber-600 group-hover:text-amber-700 flex items-center gap-1 transition">
          <span>Try scanner</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
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

          {/* Right Column: Interactive Animated Scanner Visual */}
          <div className="lg:col-span-5 w-full">
            <InteractiveScannerVisual />
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
