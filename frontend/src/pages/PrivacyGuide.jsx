import React from 'react';
import { Link } from 'react-router-dom';
import IconBadge from '../components/IconBadge';
import {
  MapPin,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  Camera,
  Share2,
} from 'lucide-react';

export default function PrivacyGuide() {
  return (
    <div className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">
      {/* Guide Hero */}
      <section className="max-w-3xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3.5 py-1 text-xs font-semibold border border-amber-100 shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
          <span>Visual Privacy Guide</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
          Understanding Hidden Photo Metadata
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Learn what information your phone embeds in every image file, the unseen risks of sharing unstripped photos, and how to disable location tagging on your devices.
        </p>
      </section>

      {/* What EXIF Reveals Section */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Info className="h-4 w-4" />
            <span>The Invisible Data Trail</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            What Is Stored Inside Your Images?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Whenever you take a photograph with a smartphone or digital camera, the device records technical tags known as EXIF (Exchangeable Image File Format) alongside the image pixels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <IconBadge icon={MapPin} variant="rose" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Exact GPS Coordinates</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Contains decimal latitude, longitude, and elevation. Anyone downloading the original image can map your location down to a few feet, exposing home, school, or workplace addresses.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-rose-600">
              Severity: High Risk
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <IconBadge icon={Camera} variant="amber" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Device & Serial Numbers</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Details the exact phone make, camera lens, operating system version, and often unique hardware serial numbers that can link photos taken by the same individual across platforms.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-amber-700">
              Severity: Medium Risk
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <IconBadge icon={Eye} variant="indigo" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Timestamps & Thumbnails</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Stores date, hour, minute, and second of capture. Embedded EXIF thumbnails can also accidentally retain uncropped portions of an image even after you cropped the photo.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-indigo-700">
              Severity: Medium Risk
            </div>
          </div>
        </div>
      </section>

      {/* How to Turn Off Location Tagging (iOS & Android) */}
      <section className="space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 mb-2">
            Device Instructions
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            How to Turn Off Location Tags
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            Prevent your camera from embedding GPS coordinates in new photos on your phone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* iOS Guide */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-7 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Apple iOS (iPhone & iPad)</h3>
                  <p className="text-xs text-slate-500">System settings & per-share privacy</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Method 1: Turn off for all future camera photos
                  </p>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open the <strong className="text-slate-800">Settings</strong> app on your iPhone.</li>
                    <li>Scroll down and tap <strong className="text-slate-800">Privacy & Security</strong>.</li>
                    <li>Tap <strong className="text-slate-800">Location Services</strong>.</li>
                    <li>Select <strong className="text-slate-800">Camera</strong> from the app list.</li>
                    <li>Choose <strong className="text-slate-800">Never</strong> (or toggle off <em>Precise Location</em>).</li>
                  </ol>
                </div>

                <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                    Method 2: Remove location before sharing existing photos
                  </p>
                  <ol className="text-xs text-amber-950 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open any photo in the <strong className="text-amber-900">Photos</strong> app and tap the <strong className="text-amber-900">Share</strong> icon.</li>
                    <li>Tap <strong className="text-amber-900">Options</strong> at the top of the share sheet.</li>
                    <li>Toggle off <strong className="text-amber-900">Location</strong> before sending via AirDrop, Mail, or messages.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Recommended for anyone frequently posting pictures to social platforms.</span>
            </div>
          </div>

          {/* Android Guide */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-7 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Google Android (Samsung, Pixel, etc.)</h3>
                  <p className="text-xs text-slate-500">Camera preferences & permissions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Method 1: Disable in Camera app settings
                  </p>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open your default <strong className="text-slate-800">Camera</strong> app.</li>
                    <li>Tap the <strong className="text-slate-800">Settings</strong> icon (gear ⚙️, usually top-left or top-right).</li>
                    <li>Find <strong className="text-slate-800">Location tags</strong> or <strong className="text-slate-800">Save location</strong>.</li>
                    <li>Toggle the switch to <strong className="text-slate-800">Off</strong>.</li>
                  </ol>
                </div>

                <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                    Method 2: Revoke system Camera location permission
                  </p>
                  <ol className="text-xs text-emerald-950 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open your phone's <strong className="text-emerald-900">Settings</strong> app.</li>
                    <li>Navigate to <strong className="text-emerald-900">Apps</strong> → <strong className="text-emerald-900">Camera</strong>.</li>
                    <li>Tap <strong className="text-emerald-900">Permissions</strong> → <strong className="text-emerald-900">Location</strong>.</li>
                    <li>Select <strong className="text-emerald-900">Don't allow</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Settings menus can vary slightly by manufacturer (One UI, Pixel UI, etc.).</span>
            </div>
          </div>
        </div>
      </section>

      {/* Safe Sharing Best Practices */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-12 space-y-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Share2 className="h-4 w-4" />
            <span>Essential Tips</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            5 Best Practices for Safe Photo Sharing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
              01
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scrub Before Marketplace Sales</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                When selling furniture, cars, or electronics on Craigslist, Facebook Marketplace, or eBay, photos taken in your living room or driveway can inadvertently invite strangers to your doorstep.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Protect Children & Family Routines</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Regularly posting backyard or park photos with timestamp and GPS tags allows malicious third parties to predict school schedules and recreation patterns.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Avoid Delaying Vacation Photos</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sharing real-time photos showing you are hundreds of miles away alerts burglars that your home is vacant. Wait until you return home or strip dates and locations before sharing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Don't Trust Messaging Apps Blindly</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                While some social platforms compress photos and strip EXIF, sending photos as "Files" or "Documents" (or via email and cloud links) preserves 100% of the raw metadata.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Ready to check your photos for hidden GPS coordinates right now?
          </p>
          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 text-xs shadow-sm transition"
          >
            <span>Scan an Image</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
