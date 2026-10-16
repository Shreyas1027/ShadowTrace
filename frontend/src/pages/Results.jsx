import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useScan } from '../context/ScanProvider';
import { formatBytes } from '../utils/formatBytes';
import IconBadge from '../components/IconBadge';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  Smartphone,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Info,
} from 'lucide-react';

export default function Results() {
  const { analysis, file, reset } = useScan();
  const navigate = useNavigate();

  // FR-NAV-04: /results without an analysis in state redirects to /scanner
  if (!analysis) {
    return <Navigate to="/scanner" replace />;
  }

  const risk = analysis.risk || {};
  const isHighRisk = risk.level === 'high';
  const isMediumRisk = risk.level === 'medium';
  const isLowRisk = risk.level === 'low';
  const isClean = risk.level === 'none' || risk.level === 'clean';

  const metadata = analysis.metadata || {};
  const locationTags = metadata.location || [];
  const captureTags = metadata.capture || [];
  const deviceTags = metadata.device || [];
  const imageTags = metadata.image || [];
  const segments = analysis.segments || [];

  const handleScanAnother = () => {
    reset();
    navigate('/scanner');
  };

  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-3 py-0.5 text-xs font-semibold border border-amber-100 mb-2">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Analysis Report</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Image Scan Completed
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            File: <span className="font-semibold text-slate-800">{file?.name || analysis.file?.name || 'Uploaded photo'}</span>
            {analysis.file?.size_bytes && (
              <span> · {formatBytes(analysis.file.size_bytes)}</span>
            )}
            {analysis.file?.width && (
              <span> · {analysis.file.width} × {analysis.file.height} ({analysis.file.megapixels} MP)</span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanAnother}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold shadow-sm transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Scan Another Image</span>
        </button>
      </div>

      {/* 3-Stage Risk Indicator Bar per FR-RISK-06 */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-card transition ${
        isHighRisk
          ? 'bg-rose-50/70 border-rose-100 text-rose-950'
          : isMediumRisk
          ? 'bg-amber-50/70 border-amber-100 text-amber-950'
          : isLowRisk
          ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
          : 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
              isHighRisk
                ? 'bg-rose-500 text-white'
                : isMediumRisk
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-500 text-white'
            }`}>
              {isHighRisk ? (
                <ShieldAlert className="h-7 w-7" />
              ) : isMediumRisk ? (
                <AlertTriangle className="h-7 w-7" />
              ) : (
                <ShieldCheck className="h-7 w-7" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isHighRisk
                    ? 'bg-rose-100 text-rose-800'
                    : isMediumRisk
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {risk.level ? `${risk.level.toUpperCase()} RISK` : 'SCANNED'}
                </span>
                <span className="text-xs text-slate-400">
                  Risk Meter Score: <strong className="text-slate-800">{risk.score || 0} / 100</strong>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isHighRisk
                  ? 'High Risk: Exact GPS Location Detected'
                  : isMediumRisk
                  ? 'Medium Risk: Metadata Identifiers Found'
                  : isLowRisk
                  ? 'Low Risk: Technical Camera Settings Only'
                  : 'Clean: Zero Privacy-Sensitive Metadata Found'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {risk.reasons && risk.reasons.length > 0
                  ? risk.reasons[0].plain_text
                  : 'Image analyzed in temporary memory.'}
              </p>
            </div>
          </div>
        </div>

        {/* 3-Segment Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-200/50">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Risk Assessment</span>
            <span>
              {isClean
                ? '✓ Clean / No sensitive data'
                : isLowRisk
                ? 'Stage 1: Low'
                : isMediumRisk
                ? 'Stage 2: Medium'
                : 'Stage 3: High'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Segment 1: Low */}
            <div className={`h-2.5 rounded-full transition-all duration-300 ${
              isClean
                ? 'bg-slate-200'
                : isLowRisk || isMediumRisk || isHighRisk
                ? 'bg-emerald-400'
                : 'bg-slate-200'
            }`} />
            {/* Segment 2: Medium */}
            <div className={`h-2.5 rounded-full transition-all duration-300 ${
              isMediumRisk || isHighRisk
                ? 'bg-amber-400'
                : 'bg-slate-200'
            }`} />
            {/* Segment 3: High */}
            <div className={`h-2.5 rounded-full transition-all duration-300 ${
              isHighRisk
                ? 'bg-rose-500'
                : 'bg-slate-200'
            }`} />
          </div>
        </div>
      </div>

      {/* GPS Location Details (if present) */}
      {analysis.gps?.present && (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-card p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Extracted GPS Coordinates</h3>
              <p className="text-xs text-slate-500">Exact physical location embedded in EXIF GPS IFD</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-rose-50/60 p-4 border border-rose-100">
              <span className="text-xs font-semibold text-rose-800 block">Latitude</span>
              <span className="text-lg font-mono font-bold text-slate-900 mt-0.5 block">
                {analysis.gps.latitude != null ? `${analysis.gps.latitude.toFixed(6)}°` : 'N/A'}
              </span>
            </div>
            <div className="rounded-2xl bg-rose-50/60 p-4 border border-rose-100">
              <span className="text-xs font-semibold text-rose-800 block">Longitude</span>
              <span className="text-lg font-mono font-bold text-slate-900 mt-0.5 block">
                {analysis.gps.longitude != null ? `${analysis.gps.longitude.toFixed(6)}°` : 'N/A'}
              </span>
            </div>
            <div className="rounded-2xl bg-rose-50/60 p-4 border border-rose-100">
              <span className="text-xs font-semibold text-rose-800 block">Altitude</span>
              <span className="text-lg font-mono font-bold text-slate-900 mt-0.5 block">
                {analysis.gps.altitude_m != null ? `${analysis.gps.altitude_m} m` : 'Not recorded'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detected Privacy Concerns */}
      {risk.reasons && risk.reasons.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Detected Privacy Findings ({risk.reasons.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {risk.reasons.map((reason, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    reason.severity === 'high'
                      ? 'bg-rose-50 text-rose-700 border border-rose-100'
                      : reason.severity === 'medium'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {reason.severity}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{reason.code}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{reason.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{reason.plain_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Metadata Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Specs */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Device Specs</h3>
              <p className="text-[11px] text-slate-400">Make, Model, Software & Identifiers</p>
            </div>
          </div>

          {deviceTags.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {deviceTags.map((tag, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium">{tag.label || tag.tag}</span>
                  <span className="font-semibold text-slate-900 font-mono text-right">{tag.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 italic text-center">
              No device identifiers found in this photo.
            </p>
          )}
        </div>

        {/* Capture Details */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Capture Details</h3>
              <p className="text-[11px] text-slate-400">Timestamps, Exposure & Settings</p>
            </div>
          </div>

          {captureTags.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto">
              {captureTags.map((tag, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium">{tag.label || tag.tag}</span>
                  <span className="font-semibold text-slate-900 font-mono text-right">{tag.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 italic text-center">
              No capture timestamp or camera settings found.
            </p>
          )}
        </div>
      </div>

      {/* Segments & Technical Properties Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">JPEG Marker Segments</h3>
          </div>
          <span className="text-xs text-slate-400">
            Token: <code className="font-mono bg-slate-50 px-2 py-1 rounded text-slate-600">{analysis.token?.slice(0, 16)}…</code>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 block font-medium">GPS Coordinates</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {analysis.gps?.present && analysis.gps?.latitude != null
                ? `${analysis.gps.latitude.toFixed(4)}, ${analysis.gps.longitude.toFixed(4)}`
                : 'Not present'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 block font-medium">Dimensions</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              {analysis.file?.width && analysis.file?.height ? `${analysis.file.width} × ${analysis.file.height}` : 'N/A'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 block font-medium">Resolution</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              {analysis.file?.megapixels ? `${analysis.file.megapixels} MP` : 'N/A'}
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-slate-400 block font-medium">Session Expiry</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              10 minutes (TTL)
            </span>
          </div>
        </div>

        {/* Segments Pill List */}
        {segments.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-500 block mb-2">Detected APP & COM Segments:</span>
            <div className="flex flex-wrap gap-2">
              {segments.map((seg, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium border ${
                    seg.removable
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                  title={`Offset: ${seg.offset}, Length: ${seg.length} bytes, Removable: ${seg.removable}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${seg.removable ? 'bg-rose-500' : 'bg-slate-400'}`} />
                  {seg.marker}: {seg.name} ({seg.length} bytes)
                  {seg.removable && <span className="text-[10px] text-rose-500 font-sans font-bold">Strip Target</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-amber-900">
            <strong className="font-bold">Real Backend Active:</strong> All metadata extracted directly from your image bytes. Milestone 6 activates lossless cleaning and verification download.
          </div>
          <button
            type="button"
            onClick={handleScanAnother}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 shrink-0 bg-white px-3.5 py-2 rounded-lg border border-amber-200 shadow-sm transition"
          >
            <span>Scan Another Image</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
