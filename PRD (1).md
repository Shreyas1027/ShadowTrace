# ShadowTrace — Product Requirements Document

> **Tagline:** *Know what your images reveal.*
> **Version:** 1.0 (V1 scope) · **Status:** Authoritative build specification
> **Audience:** Implementers (including Antigravity), reviewers, and security auditors

---

## 1. Executive Summary & Goals

### 1.1 Problem

Photographs taken on smartphones and digital cameras silently embed hidden metadata: EXIF tags, GPS coordinates, timestamps, device make/model, serial numbers, software tags, embedded thumbnails, XMP packets, IPTC records and free-text comments. When such a photo is shared, it can unintentionally reveal a user's home location, school or workplace, daily habits, and device identity.

### 1.2 Product

ShadowTrace is a web utility that:

1. Accepts user-uploaded **JPEG** photos.
2. Extracts and displays all hidden metadata segments (EXIF, GPS, XMP, IPTC, comments).
3. Computes a clear, rule-based **Privacy Risk Level**:
   - **High** — exact GPS coordinates present.
   - **Medium** — timestamps, device identifiers, serial numbers, software tags, or embedded thumbnails present.
   - **Low** — harmless technical camera properties only (ISO, aperture, focal length, etc.).
   - **None** — no privacy-relevant metadata (shown as the "Clean" state; see FR-RISK).
4. **Strips** the metadata with a lossless JPEG segment rewrite (preserving image quality, pixel hashes, and colour markers such as ICC/JFIF), with a fallback re-encode **only** when EXIF orientation must be baked into the pixels.
5. **Re-inspects** the cleaned image using independent readers and verifies zero targeted metadata remains **before** issuing a download.
6. Enforces a strict **ephemeral server-side privacy lifecycle**: images live in temporary token directories with a 10-minute TTL and are purged by a background janitor or immediately upon download.

### 1.3 Goals

| # | Goal |
|---|------|
| G1 | Make hidden image metadata visible and understandable to non-technical users. |
| G2 | Remove that metadata without degrading the image. |
| G3 | Prove removal through independent verification, not assumption. |
| G4 | Retain nothing: no database, no accounts, no analytics, no lingering files. |
| G5 | Deliver a warm, modern, consumer-friendly interface (AcademiX design language). |

### 1.4 Success Criteria (Measurable)

| ID | Criterion | Measurement |
|----|-----------|-------------|
| **SC-01** | Detection accuracy: 100% of fixtures containing GPS IFD are classified **High**. | Automated test over a fixture corpus of ≥ 30 JPEGs (GPS, timestamp-only, device-only, ISO-only, no metadata, XMP-only GPS, IPTC-only). |
| **SC-02** | Zero targeted metadata after cleaning: post-clean verification passes for 100% of fixtures; any failure blocks download. | Verifier test suite + deliberately sabotaged cleaner test that must yield `verification_failed`. |
| **SC-03** | Lossless guarantee: for non-orientation images, decoded pixel hash (SHA-256 of raw RGB) before == after. | Pixel-hash comparison test on all fixtures. |
| **SC-04** | Colour fidelity: ICC profile and JFIF marker (when present) are byte-identical after cleaning. | Segment diff test. |
| **SC-05** | Ephemeral lifecycle: 0 files remain on disk 10 minutes (+ ≤ 60 s janitor interval) after upload, and 0 files remain immediately after successful download. | Time-travel/clock-injection test + filesystem assertion. |
| **SC-06** | Performance: analyze + clean + verify for a 10 MB / 12 MP JPEG completes in ≤ 3 s at p95 on a 2-vCPU machine. | Benchmark script. |
| **SC-07** | Security rejection: 100% of malformed inputs (wrong magic bytes, MIME spoof, > 10 MB, > 50 MP, truncated JPEG, polyglots) are rejected with the correct error code and no file persisted. | Negative test suite. |
| **SC-08** | Privacy of the product itself: zero third-party network requests from the frontend (no map tiles, fonts CDN, analytics, trackers), verified in browser network tab and by CSP. | Manual + automated Playwright network assertion. |

---

## 2. Scope & Boundaries

### 2.1 In Scope (V1)

- JPEG files only (`.jpg`, `.jpeg`; `image/jpeg`).
- Single-file upload per analysis session.
- Metadata extraction: EXIF (IFD0, ExifIFD, GPS IFD, Interop IFD, IFD1 thumbnail), XMP (APP1 XMP namespace), IPTC-IIM (APP13 Photoshop 3.0 / 8BIM), JPEG COM comments, and other APPn vendor segments (reported by name and size).
- GPS output in decimal degrees (no map rendering).
- Rule-based, deterministic risk scoring with plain-language reasons.
- Lossless cleaning, optional orientation-baking fallback, independent verification.
- Ephemeral token-based download.
- Responsive web UI, English only.

### 2.2 Out of Scope (V1)

- PNG, HEIC/HEIF, WebP, TIFF, RAW, video, or PDF files.
- Batch/multi-file processing.
- User accounts, history, saved reports, databases, cloud storage.
- Analytics, telemetry, cookies, trackers, A/B tools.
- Selective ("keep copyright, strip GPS") cleaning — V1 is all-or-nothing on targeted metadata.
- Reverse-geocoding or any external API call.

### 2.3 Hard Prohibitions

- **No third-party map tiles, embeds, or geocoding services.** Rendering a map from GPS coordinates via a third-party tile server would leak the very location the product is warning about. GPS is shown only as text (decimal degrees and a plain-language precision note).
- **No external fonts/CDNs at runtime.** Fonts are self-hosted (system font stack by default).
- **No persistence of image bytes beyond the TTL.**
- **No logging of metadata values, filenames supplied by the client, or coordinates.**

---

## 3. Technology Stack & Folder Structure

### 3.1 Stack

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Frontend | React 18, Vite, JavaScript (ES modules), Tailwind CSS, Lucide React, react-router-dom | Pure client: UI, upload form, rendering of server results. |
| Backend | Python 3.10+, Flask REST API | All validation, parsing, risk, cleaning, verification, lifecycle. |
| Image libs | **Pillow** (decode, dimension/bounds validation, orientation fallback re-encode); **exifread** (independent post-clean verifier); custom `jpeg_segments.py` (segment scanner/writer) | |
| Support | flask-cors, python-dotenv | CORS allow-list and environment config. |
| State | React Context (`ScanProvider`), in-memory only | No database, no `localStorage`/`sessionStorage`/cookies for image data. |

### 3.2 Trust Boundary

```
┌──────────────────────────┐        HTTPS         ┌─────────────────────────────────────────┐
│  Browser (UNTRUSTED)     │  ─────────────────▶  │  Flask backend (TRUSTED)                │
│  React client only       │                      │  validate → parse → risk → clean →      │
│  - renders results       │  ◀─────────────────  │  verify → serve → purge                 │
│  - holds ScanProvider    │       JSON/bytes     │  Temp token dirs (TTL 10 min)           │
└──────────────────────────┘                      └─────────────────────────────────────────┘
```

All file validation, parsing, risk assessment and metadata cleaning occur **strictly server-side**. The frontend never decides risk, never parses EXIF, never cleans files, and any client-side checks (size, extension) are UX hints only and are re-enforced by the server.

### 3.3 Folder Structure

```
shadowtrace/
├── README.md                     # Technical specs, setup, dependency list (ONLY place for these)
├── PRD.md                        # This document
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js            # dev proxy /api → http://localhost:5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example              # VITE_API_BASE_URL
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Router + ScanProvider
│       ├── index.css             # Tailwind layers, ambient background, tokens
│       ├── context/
│       │   └── ScanProvider.jsx  # In-memory scan state (see §3.4)
│       ├── api/
│       │   └── client.js         # fetch wrappers for all endpoints
│       ├── layout/
│       │   ├── AppShell.jsx
│       │   ├── Header.jsx
│       │   └── Footer.jsx
│       ├── pages/
│       │   ├── Landing.jsx       # "/"  (Overview)
│       │   ├── Scanner.jsx       # "/scanner"
│       │   ├── Results.jsx       # "/results"
│       │   ├── PrivacyGuide.jsx  # "/guide"
│       │   ├── About.jsx         # "/about"
│       │   └── NotFound.jsx
│       ├── components/
│       │   ├── UploadZone.jsx
│       │   ├── FileStatus.jsx
│       │   ├── RiskMeter.jsx     # 3-stage indicator bar
│       │   ├── RiskBadge.jsx
│       │   ├── MetadataTable.jsx
│       │   ├── ImagePreviewCard.jsx
│       │   ├── CleanPanel.jsx
│       │   ├── VerificationChecklist.jsx
│       │   ├── IconBadge.jsx
│       │   ├── FeatureCard.jsx
│       │   └── ErrorBanner.jsx
│       └── utils/
│           ├── formatBytes.js
│           └── errorMessages.js  # error code → friendly text
└── backend/
    ├── requirements.txt
    ├── .env.example
    ├── run.py                    # dev entry
    ├── wsgi.py                   # production entry (gunicorn)
    ├── app/
    │   ├── __init__.py           # app factory, CORS, limits, janitor start
    │   ├── config.py
    │   ├── routes/
    │   │   ├── health.py
    │   │   ├── analyze.py
    │   │   ├── clean.py
    │   │   ├── download.py
    │   │   ├── preview.py
    │   │   └── session.py
    │   ├── services/
    │   │   ├── validation.py     # magic bytes, MIME, Pillow, size/MP bounds
    │   │   ├── jpeg_segments.py  # scanner + writer (custom)
    │   │   ├── metadata.py       # EXIF/GPS/XMP/IPTC/COM extraction
    │   │   ├── risk.py           # deterministic rules + reasons
    │   │   ├── cleaner.py        # lossless rewrite + orientation fallback
    │   │   ├── verifier.py       # independent 4-point verification
    │   │   ├── storage.py        # token dirs, TTL, consume-on-download
    │   │   └── janitor.py        # background purge thread
    │   └── utils/
    │       ├── errors.py         # error classes + JSON handler
    │       └── logging_safe.py   # sanitizing log filter
    ├── tmp/                      # runtime token dirs (gitignored, created at boot)
    └── tests/
        ├── fixtures/             # generated + sample JPEGs
        ├── test_validation.py
        ├── test_segments.py
        ├── test_metadata.py
        ├── test_risk.py
        ├── test_cleaner.py
        ├── test_verifier.py
        ├── test_lifecycle.py
        └── test_api.py
```

### 3.4 Client State Shape (`ScanProvider`)

```js
{
  status: 'idle' | 'uploading' | 'analyzed' | 'cleaning' | 'cleaned' | 'error',
  file: File | null,                 // held only in memory
  token: string | null,
  analysis: AnalyzeResponse | null,  // see §6.2
  cleanResult: CleanResponse | null, // see §6.3
  error: { code, message } | null,
  expiresAt: number | null           // epoch ms; drives countdown UI
}
// Actions: startAnalyze(file), startClean(), download(), reset()
```

`reset()` must also call `DELETE /api/session/<token>` (best effort) and revoke any `URL.createObjectURL` handles. No state is written to browser storage.

---

## 4. UI/UX Design System (AcademiX Design Language)

### 4.1 Mandatory Direction

**Forbidden:** dark mode, black terminal themes, matrix-green/cyan glows, graph-paper grids, wireframe/outline-only borders, monospace "hacker" chrome, developer clutter, console-style logs in the UI.

**Required:** a modern, warm, elevated SaaS aesthetic: soft ambient canvas, floating white cards, amber accent, friendly pastel status containers, bold tight-tracked sans typography.

### 4.2 Design Tokens

| Token | Value | Tailwind mapping / usage |
|-------|-------|--------------------------|
| `--canvas` | `#FDFBF7` | `bg-[#FDFBF7]` — page background |
| `--glow-peach` | `#FFF8ED` | corner radial glows (see §4.4) |
| `--surface` | `#FFFFFF` | `bg-white` — all cards |
| `--border-soft` | `rgba(0,0,0,0.04)` / slate-100 | `border border-slate-100` |
| `--ink` | slate-900 `#0F172A` | `text-slate-900` — headings, key text |
| `--ink-muted` | slate-500 `#64748B` | `text-slate-500` — secondary |
| `--accent` | amber-500 `#F59E0B` | `bg-amber-500`, `text-amber-500` |
| `--accent-strong` | amber-600 `#D97706` | hover/pressed, text on light amber |
| `--ok-bg / --ok-fg` | emerald-50 / emerald-700 | clean / verified / low-risk |
| `--warn-bg / --warn-fg` | amber-50 / amber-700 | medium risk |
| `--danger-bg / --danger-fg` | rose-50 / rose-700 | high risk (GPS) |
| `--info-bg / --info-fg` | indigo-50 / indigo-600 | neutral info icon badges |

Extend `tailwind.config.js`:

```js
theme: { extend: {
  colors: { canvas: '#FDFBF7', glow: '#FFF8ED' },
  boxShadow: {
    card:  '0 20px 40px -15px rgba(0,0,0,0.06)',
    float: '0 30px 60px -20px rgba(15,23,42,0.12)'
  },
  fontFamily: { sans: ['Inter','ui-sans-serif','system-ui','-apple-system','Segoe UI','Roboto','sans-serif'] }
}}
```

> `Inter` must be **self-hosted** (bundled via `@fontsource/inter` or local files) or omitted in favour of the system stack. No Google Fonts links.

### 4.3 Typography

| Role | Classes |
|------|---------|
| Hero H1 | `text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.05]` |
| Section H2 | `text-3xl font-bold text-slate-900 tracking-tight` |
| Card title | `text-lg font-semibold text-slate-900` |
| Body | `text-base text-slate-600 leading-relaxed` |
| Caption / label | `text-xs font-semibold uppercase tracking-wider text-slate-400` |
| Metadata value | `text-sm font-medium text-slate-900 break-words` (monospace permitted **only** for raw hex/serial values via `font-mono text-[13px]`, never for chrome) |

**Two-tone headline pattern:** the hero reads "Know What Your Images" in slate-900 and **"Reveal"** in amber (`<span class="text-amber-500">Reveal</span>`). Optionally a soft amber underline swoosh (inline SVG, no external asset).

### 4.4 Atmosphere & Background

```css
/* index.css */
body {
  background-color: #FDFBF7;
  background-image:
    radial-gradient(60rem 40rem at 0% 0%,   #FFF8ED 0%, transparent 60%),
    radial-gradient(50rem 36rem at 100% 0%, rgba(253,230,138,0.25) 0%, transparent 60%),
    radial-gradient(60rem 40rem at 100% 100%, #FFF8ED 0%, transparent 60%);
  background-attachment: fixed;
}
```

No grids, no noise, no scanlines.

### 4.5 Elevation & Card Architecture

| Component | Classes |
|-----------|---------|
| Standard card | `bg-white rounded-2xl border border-slate-100 shadow-card p-6` |
| Hero floating card | `bg-white rounded-3xl border border-slate-100 shadow-float p-8` (optionally `rotate-0 hover:-translate-y-0.5 transition`) |
| Pill badge | `inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold border border-amber-100` |
| Status pill | same shape with emerald / amber / rose variants |
| Primary button | `inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 shadow-[0_10px_20px_-8px_rgba(217,119,6,0.55)] transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed` |
| Secondary button | `rounded-xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 px-5 py-3 font-semibold` |
| Icon badge | `w-12 h-12 rounded-xl flex items-center justify-center` + pastel bg (`bg-amber-50 text-amber-600`, `bg-emerald-50 text-emerald-600`, `bg-indigo-50 text-indigo-600`) wrapping a 22px Lucide icon |

### 4.6 Layout Specifications

- **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Breakpoints:** mobile-first; hero is single-column < `lg`, two-column ≥ `lg` (`grid lg:grid-cols-2 gap-12 items-center`).
- **Spacing rhythm:** sections `py-16 lg:py-24`; card grids `gap-6`.
- **Motion:** subtle only (150–250 ms ease-out transitions, fade/slide-up on mount). Respect `prefers-reduced-motion`.
- **Accessibility:** WCAG 2.1 AA contrast; focus-visible rings; `aria-live="polite"` for status changes; all icons have labels or `aria-hidden`.

### 4.7 Lucide Icon Map

| Purpose | Icon |
|---------|------|
| Brand | `ScanSearch` (or `Aperture`) |
| Location / GPS | `MapPin` |
| Timestamp | `Clock` |
| Device | `Smartphone` / `Camera` |
| Image properties | `Image` |
| Clean / verified | `ShieldCheck` |
| Warning | `AlertTriangle` |
| Upload | `UploadCloud` |
| Download | `Download` |
| Ephemeral | `Timer` |
| No tracking | `EyeOff` |

### 4.8 Risk Colour Mapping

| Level | Pill / box | Meter segments lit |
|-------|-----------|--------------------|
| None (Clean) | emerald-50 / emerald-700 | none (shows ✓ "Nothing sensitive found") |
| Low | emerald-50 / emerald-700 | 1 (emerald-400) |
| Medium | amber-50 / amber-700 | 2 (amber-400) |
| High | rose-50 / rose-700 | 3 (rose-500) |

---

## 5. Functional Requirements

Priority keys: **M** = must, **S** = should.

### 5.1 FR-LAND — Landing Page (`/`)

| ID | Requirement | P |
|----|-------------|---|
| FR-LAND-01 | Desktop (≥ `lg`): side-by-side hero. **Left column:** pill badge ("Free · No account · Nothing stored"), two-tone H1 ("Know What Your Images **Reveal**"), 1–2 sentence subtext explaining hidden metadata, and a row/grid of 3 small benefit cards with icon badges (e.g., *Find hidden GPS* — amber/MapPin; *Clean without quality loss* — emerald/ShieldCheck; *Deleted in 10 minutes* — indigo/Timer). | M |
| FR-LAND-02 | **Right column:** floating elevated white card containing the drag-and-drop upload zone, selected-file status row (name, size, remove button), inline validation hints, and an **"Analyze Image"** primary CTA. | M |
| FR-LAND-03 | Mobile: columns stack, upload card appears **first** below the headline. | M |
| FR-LAND-04 | Upload zone supports click-to-browse and drag-and-drop with visible drag-over state (amber-300 dashed inner border on amber-50 fill — dashed *inner* affordance only; outer card remains solid). Keyboard operable (Enter/Space opens picker). | M |
| FR-LAND-05 | Client-side hints (non-authoritative): accept `.jpg,.jpeg`, ≤ 10 MB. Rejections show friendly text but the server remains the authority. | M |
| FR-LAND-06 | "Analyze Image" is disabled until a file is selected; shows spinner and "Analyzing…" while the request is in flight; on success navigates to `/results`. | M |
| FR-LAND-07 | Below the hero: a "How it works" 3-step row (Upload → Review risk → Clean & verify) and a short "Why it matters" strip. No technical dependency names anywhere. | S |
| FR-LAND-08 | A trust line near the CTA: "Your photo is processed in memory-safe temporary storage and deleted within 10 minutes." | M |

### 5.2 FR-NAV — Application Navigation

| ID | Requirement | P |
|----|-------------|---|
| FR-NAV-01 | Clean top header (sticky, `bg-white/80 backdrop-blur border-b border-slate-100`) with the **ShadowTrace** wordmark (icon badge + bold text, "Trace" optionally amber) and links: **Overview** (`/`), **Image Scanner** (`/scanner`), **Privacy Guide** (`/guide`), **About** (`/about`). | M |
| FR-NAV-02 | Active link: `text-slate-900` with amber underline/pill; inactive `text-slate-500 hover:text-slate-900`. | M |
| FR-NAV-03 | Mobile: hamburger opens a white sheet menu; focus trapped while open; closes on route change/Escape. | M |
| FR-NAV-04 | `/scanner` is the focused upload workspace (same upload card as the hero, centred). `/results` without an `analysis` in state redirects to `/scanner`. Unknown routes render `NotFound` with a friendly link home. | M |
| FR-NAV-05 | **Privacy Guide** page: consumer-friendly cards explaining what EXIF/GPS reveal, how to disable location tagging on iOS/Android, and safe sharing tips. | S |
| FR-NAV-06 | **About** page: consumer-facing mission page titled **"Protecting visual privacy before you share"** with a hero statement, 3–4 feature cards (icon badges: Private by design, Lossless cleaning, Verified results, No accounts or tracking), and a short "How we treat your photos" section. **MUST NOT** list npm/pip packages, framework names, versions, or internal dependencies. Technical specs live solely in `README.md`. | M |
| FR-NAV-07 | Footer: wordmark, one-line tagline, links to Privacy Guide and About. No social trackers. | S |

### 5.3 FR-UP — Upload & Server-Side Validation

Executed by `validation.py` in this exact order; the first failure aborts, stores nothing, and returns the mapped error.

| ID | Check | Rule | Error code (HTTP) |
|----|-------|------|-------------------|
| FR-UP-01 | Presence | Multipart field `image` exists, non-empty. | `NO_FILE` (400) |
| FR-UP-02 | Size (streaming) | Reject if > **10 MB (10,485,760 bytes)**. Enforce via Flask `MAX_CONTENT_LENGTH` **and** a bounded read count while buffering. | `FILE_TOO_LARGE` (413) |
| FR-UP-03 | Magic bytes | First 3 bytes must equal `FF D8 FF`. | `INVALID_SIGNATURE` (415) |
| FR-UP-04 | Trailer sanity | Last 2 bytes should be `FF D9` (warn-level tolerance for trailing padding, but segment scanner must locate EOI). | `TRUNCATED_JPEG` (422) |
| FR-UP-05 | Declared MIME | Client `Content-Type` of the part must be `image/jpeg` (also accept `image/jpg`). MIME is **advisory**; magic bytes are authoritative, but mismatch is rejected to catch spoofing. | `UNSUPPORTED_TYPE` (415) |
| FR-UP-06 | Extension | Original filename extension (case-insensitive) in `{.jpg, .jpeg}`; filename is otherwise **ignored** and never used for storage paths. | `UNSUPPORTED_TYPE` (415) |
| FR-UP-07 | Header-level dimensions | Parse SOF marker with `jpeg_segments.py` first to read width × height **without decoding**; reject if width × height > **50,000,000 px (50 MP)** or either dimension is 0. | `IMAGE_TOO_LARGE` (413) |
| FR-UP-08 | Pillow decode | Set `Image.MAX_IMAGE_PIXELS = 50_000_000` and treat `DecompressionBombWarning` as an error (`warnings.simplefilter('error', Image.DecompressionBombWarning)`). Call `Image.open(...).verify()`, then re-open and `.load()` in a bounded context to prove the data decodes. Format must be `JPEG`. | `CORRUPT_IMAGE` (422) / `IMAGE_TOO_LARGE` (413) |
| FR-UP-09 | Segment structure | `jpeg_segments.py` must parse the full marker chain (SOI → segments → SOS → entropy data → EOI) without length overruns. | `MALFORMED_STRUCTURE` (422) |
| FR-UP-10 | Storage | On success, create token dir, write the original as `original.jpg` using a server-generated name only. | — |
| FR-UP-11 | Rate limiting | Per-IP limit (default 30 requests/min, configurable) on upload endpoints. | `RATE_LIMITED` (429) |

### 5.4 FR-META — Metadata Extraction

Implemented in `metadata.py` on top of `jpeg_segments.py` (segment-level) and Pillow/exifread (tag-level, read-only).

| ID | Requirement |
|----|-------------|
| FR-META-01 | Enumerate **every** marker segment with `{marker, name, offset, length}`; classify APP0 (JFIF), APP1 (EXIF / XMP), APP2 (ICC / FlashPix / MPF), APP13 (IPTC/Photoshop), APP14 (Adobe), other APPn, and COM. |
| FR-META-02 | **EXIF:** parse IFD0, ExifIFD, GPS IFD, Interop IFD and IFD1 (thumbnail). Report tags grouped into four display categories: **Location**, **Capture Details**, **Device Specs**, **Image Properties** (mapping in §5.4.1). Unknown/maker-note tags are reported as `MakerNote (n bytes)`. |
| FR-META-03 | **GPS:** convert degree/minute/second rationals + ref (N/S/E/W) to signed **decimal degrees** with 6-decimal precision; also report altitude (m, with below-sea-level ref), speed, direction, and GPS timestamp when present. Validate ranges (|lat| ≤ 90, |lon| ≤ 180); invalid GPS data is flagged `gps.valid=false` but **still counts as High risk** (presence of a GPS IFD with coordinates fields). |
| FR-META-04 | **XMP:** detect the `http://ns.adobe.com/xap/1.0/` packet (and Extended XMP). Extract privacy-relevant properties by safe parsing (use `defusedxml`-equivalent hardened parsing or a non-resolving regex scanner — **no external entity or DTD resolution**): `exif:GPS*`, `photoshop:City/State/Country`, `xmp:CreatorTool`, `xmp:CreateDate`, `dc:creator`, `aux:SerialNumber`, `aux:LensSerialNumber`, `xmpMM:History`. Report packet size and the list of namespaces. |
| FR-META-05 | **IPTC-IIM:** parse APP13 `8BIM 0x0404` records; report dataset IDs and decoded text for By-line, Credit, Source, City, Province/State, Country, Caption/Abstract, Keywords, Date/Time Created, Copyright Notice, Contact. |
| FR-META-06 | **Comments:** report each JPEG `COM` (0xFE) segment (truncate display to 500 chars; flag if non-printable). |
| FR-META-07 | **Embedded thumbnail:** detect EXIF IFD1 thumbnail (JPEGInterchangeFormat/Length) and report size + dimensions; thumbnails count as Medium because they may retain pre-crop content. A separate `thumbnail_preview` is **not** served to the client in V1. |
| FR-META-08 | **Image properties:** width, height, megapixels, JFIF/Adobe colour hints, ICC profile description (name only), bit depth, subsampling when derivable, file size, EXIF orientation (1–8). |
| FR-META-09 | All string values are decoded safely (`errors='replace'`), stripped of NULs/control characters, length-capped at 1,000 chars, and returned as JSON strings (never as HTML). The frontend renders them as text nodes only (no `dangerouslySetInnerHTML`). |
| FR-META-10 | Parsing must be fault-tolerant: a malformed IFD or tag yields a `warnings[]` entry and continues; it must never crash the request or hang (hard 2 s parse budget and IFD loop/offset-cycle guard). |

#### 5.4.1 Display Category Mapping

| Category | Typical tags |
|----------|--------------|
| **Location** | All GPS IFD tags, XMP GPS, IPTC City/State/Country/Sublocation |
| **Capture Details** | DateTime, DateTimeOriginal, DateTimeDigitized, SubSecTime*, OffsetTime*, ExposureTime, FNumber, ISO, FocalLength, FocalLengthIn35mm, Flash, WhiteBalance, MeteringMode, ExposureProgram, LensModel |
| **Device Specs** | Make, Model, Software, BodySerialNumber, LensSerialNumber, CameraOwnerName, ImageUniqueID, HostComputer, MakerNote, XMP CreatorTool, IPTC By-line/Credit/Source |
| **Image Properties** | Width, Height, Orientation, ColorSpace, Resolution(X/Y/Unit), YCbCrPositioning, Compression, Thumbnail, ICC profile name, JFIF version, COM comments |

### 5.5 FR-RISK — Deterministic Risk Evaluation

Implemented in `risk.py` as a pure function `evaluate(metadata) -> {level, score, reasons[], flags{}}`. No randomness, no ML, no network. The same input always produces the same output.

**Levels (highest matching rule wins):**

| Level | Rule | Trigger examples |
|-------|------|------------------|
| **High** | Exact GPS coordinates are present (EXIF GPSLatitude+GPSLongitude, or XMP `exif:GPSLatitude/Longitude`, with parsable or unparsable values). | GPS IFD with lat/lon. |
| **Medium** | No GPS, **and** at least one of: timestamps (DateTime/Original/Digitized, SubSec, OffsetTime, GPSDateStamp, XMP CreateDate, IPTC DateCreated); device identifiers (Make, Model, HostComputer, CameraOwnerName); serial numbers (Body/Lens/Camera serial, ImageUniqueID, MakerNote with serial pattern); software tags (Software, CreatorTool); embedded thumbnail; IPTC identity/location text; author/copyright names; non-empty comments. | Make/Model, DateTimeOriginal, thumbnail. |
| **Low** | No GPS and no Medium triggers, but harmless technical camera tags exist: ExposureTime, FNumber, ISO, FocalLength, Flash, WhiteBalance, MeteringMode, ExposureProgram, ColorSpace, Orientation, resolution tags. | ISO/aperture only. |
| **None** | No EXIF/XMP/IPTC/COM metadata (only structural segments like JFIF/ICC/Adobe). Displayed as **Clean** with an emerald "No hidden metadata found" state. | Pre-cleaned images. |

**Requirements:**

| ID | Requirement |
|----|-------------|
| FR-RISK-01 | Evaluate rules in order High → Medium → Low → None and return on first match, but **always collect all reasons** for display (e.g., a High image also lists its timestamp and device findings). |
| FR-RISK-02 | Each reason is `{code, severity, title, plain_text}` in friendly language, e.g. *"This photo contains the exact GPS location (47.620422, -122.349358) where it was taken. Anyone who receives the original file could find this place."* Reason codes are stable: `GPS_PRESENT`, `TIMESTAMP_PRESENT`, `DEVICE_ID_PRESENT`, `SERIAL_PRESENT`, `SOFTWARE_PRESENT`, `THUMBNAIL_PRESENT`, `AUTHOR_INFO_PRESENT`, `COMMENT_PRESENT`, `TECHNICAL_ONLY`, `NO_METADATA`. |
| FR-RISK-03 | Return a `flags` object of booleans for each trigger plus counts, enabling the UI to render category callouts. |
| FR-RISK-04 | Return `score` (0–100) purely for visual meter positioning: High = 100, Medium = 60, Low = 25, None = 0. The **level** is authoritative; score is cosmetic. |
| FR-RISK-05 | Coordinates in reasons are shown in decimal degrees from the **server response only**; they are never logged and never sent to any third party. |
| FR-RISK-06 | Results View renders a **3-stage risk indicator bar** (Low · Medium · High) with the active stage highlighted and a plain-language summary; the *None* level renders the same bar in an all-neutral state with the Clean badge. |
| FR-RISK-07 | Unit tests must cover every rule branch, and a table-driven test confirms precedence (GPS + timestamp ⇒ High; timestamp + ISO ⇒ Medium; ISO only ⇒ Low; none ⇒ None). |

### 5.6 FR-CLEAN — Cleaning & Verification Pipeline

#### 5.6.1 Lossless Marker Rewrite

Implemented in `cleaner.py` using the writer in `jpeg_segments.py`.

| ID | Requirement |
|----|-------------|
| FR-CLEAN-01 | **Never decode pixels in the default path.** Copy the compressed entropy-coded scan data byte-for-byte; rewrite only the marker segments preceding SOS (and any between scans for progressive JPEG). |
| FR-CLEAN-02 | **Remove (targeted):** APP1 EXIF, APP1 XMP and Extended XMP, APP13 (Photoshop/IPTC), COM, APP1/APPn vendor segments carrying text or identifiers (e.g., Adobe-IRB inside APP13, Ducky APP12, Meta/FlashPix APP2 `FPXR`, MPF APP2 `MPF\0`, Samsung/Apple/etc. vendor APPn, trailing data after EOI). |
| FR-CLEAN-03 | **Preserve (structural/colour):** SOI, EOI, DQT, DHT, DRI, SOF*, SOS, entropy data, restart markers, **APP0 JFIF**, **APP2 ICC_PROFILE** (all chunks, in order, byte-identical), **APP14 Adobe** (colour transform flag only; contains no personal data). |
| FR-CLEAN-04 | **Trailing data:** truncate everything after the final EOI (hidden payloads, MPF secondary images, appended thumbnails). |
| FR-CLEAN-05 | **Guarantee:** for lossless-path outputs, the SHA-256 of the decoded pixel array (Pillow RGB) before == after; the response includes `pixels_identical: true` and both hashes' short prefixes (first 12 hex chars) for transparency. |
| FR-CLEAN-06 | **Output file:** write to `cleaned.jpg` inside the token dir with a temporary name + atomic `os.replace` so partial files can never be served. |

#### 5.6.2 Orientation Handling

| ID | Requirement |
|----|-------------|
| FR-CLEAN-07 | Read EXIF Orientation (tag 0x0112) **before** stripping. |
| FR-CLEAN-08 | If Orientation is absent or `1` → lossless path only. |
| FR-CLEAN-09 | If Orientation is `2–8` → removing EXIF would visually rotate the image for viewers, so a **fallback re-encode** is required: apply `ImageOps.exif_transpose`, then re-save with Pillow at **quality 95, `subsampling='keep'` when possible, `optimize=False`, preserving the ICC profile bytes and passing no `exif=` argument**. The response flags `method: "reencode_orientation"` and `pixels_identical: false`, with a user-visible note: "This photo was rotated using hidden orientation data. To keep it upright, ShadowTrace re-saved it at very high quality." (Lossless transformations via `jpegtran`-style DCT-domain rotation are an optional V2 enhancement; V1 uses the Pillow fallback.) |
| FR-CLEAN-10 | Re-encoded output must still pass the full verification below. |

#### 5.6.3 Independent 4-Point Verification

Implemented in `verifier.py`. Verification runs on `cleaned.jpg` **after** it is written and **before** any download token is marked downloadable. It uses readers independent of the cleaner's own writer logic.

| # | Check | Reader | Pass condition |
|---|-------|--------|----------------|
| **V1** | **Segment audit** | Fresh instance of `jpeg_segments.py` scanner (parse-only code path, not the writer) | No APP1 (EXIF/XMP), APP13, COM, or other targeted APPn segments; no bytes after EOI; only allowlisted markers remain. |
| **V2** | **exifread scan** | `exifread.process_file(..., details=True)` | Returns zero tags (excluding explicitly allowlisted structural tags if any), and no thumbnail. |
| **V3** | **Pillow scan** | `Image.getexif()`, `img.info` (`exif`, `xmp`, `comment`, `photoshop`), `Image.getxmp()` | EXIF empty (`len == 0`), no GPS IFD (`get_ifd(0x8825)` empty), no `xmp`/`comment`/`photoshop` keys. |
| **V4** | **Raw byte-pattern scan** | Binary search of the full output | Absence of the byte signatures `Exif\0\0`, `http://ns.adobe.com/xap/1.0/`, `Photoshop 3.0`, `8BIM`, and absence of any **string/numeric values** harvested from the original metadata (e.g., the original Make, Model, serial, and GPS strings/rational byte patterns) within non-entropy regions. |

| ID | Requirement |
|----|-------------|
| FR-CLEAN-11 | All four checks must pass for the response to report `verified: true`. |
| FR-CLEAN-12 | **Any failure ⇒ no download is issued.** The server deletes `cleaned.jpg`, keeps `original.jpg` until TTL, returns `VERIFICATION_FAILED` (500) with the failed check names (never the leaked values). |
| FR-CLEAN-13 | Verification result is stored in the token's `state.json` so `/api/download/<token>` can independently re-confirm `verified == true` before serving. |
| FR-CLEAN-14 | Colour check (`SC-04`): confirm ICC and JFIF segments (if present in the original) are byte-identical in the output; report `color_preserved: true/false`. Failure here is a **warning**, not a blocker, except when the original ICC was dropped on the lossless path (that is a bug and fails tests). |
| FR-CLEAN-15 | The Results View shows a **verification checklist** with four friendly lines ("Hidden segments removed", "Independent EXIF scan clean", "Image library scan clean", "Raw data scan clean"), each with emerald check icons, before the Download button appears. |

### 5.7 FR-DL — Ephemeral Token Lifecycle & Download

| ID | Requirement |
|----|-------------|
| FR-DL-01 | **Token:** `secrets.token_urlsafe(32)` (≥ 256 bits entropy). Regex-validated on every route: `^[A-Za-z0-9_-]{43}$`. |
| FR-DL-02 | **Storage layout:** `backend/tmp/<token>/{original.jpg, cleaned.jpg, state.json}`; directory mode `0700`, files `0600`. `state.json` holds `{created_at, expires_at, status, verified, method, downloaded}` and **never** metadata values. |
| FR-DL-03 | **TTL:** `expires_at = created_at + 600 s`. Expired tokens return `410 TOKEN_EXPIRED` and are purged on access. TTL is fixed from first upload (not extended by activity). |
| FR-DL-04 | **Janitor:** a daemon thread (started in the app factory; guarded to start once under gunicorn via file lock) wakes every **30 s**, deletes every token dir whose `expires_at < now`, and also sweeps orphan dirs older than TTL + grace (e.g., from crashes). On boot, it purges **all** pre-existing token dirs. |
| FR-DL-05 | **Consume on download:** a successful `GET /api/download/<token>` streams `cleaned.jpg`, then purges the **entire** token directory (including `original.jpg`) as soon as the stream completes (`call_on_close`). A second request returns `404 TOKEN_NOT_FOUND`. |
| FR-DL-06 | **Downloadable gate:** only when `state.verified == true`. Otherwise `409 NOT_VERIFIED`. |
| FR-DL-07 | **Download filename:** server computes `shadowtrace_clean_<8 hex chars>.jpg`; the client's original filename is never reflected (prevents header injection and leaking). Response headers: `Content-Type: image/jpeg`, `Content-Disposition: attachment`, `Cache-Control: no-store, max-age=0`, `X-Content-Type-Options: nosniff`. |
| FR-DL-08 | **Previews:** `/api/preview/<token>/original` and `/cleaned` serve inline `image/jpeg` for the Results View and are subject to the same TTL (they do **not** consume the token). Previews are served as **recoded, metadata-free** thumbnails (max 1,200 px edge, Pillow re-encode, no EXIF) so that previewing the original in the browser cannot itself leak metadata through caches or devtools; the download path always serves the true cleaned file. |
| FR-DL-09 | **Explicit delete:** `DELETE /api/session/<token>` purges immediately (used by "Start over", `beforeunload` via `sendBeacon`). |
| FR-DL-10 | **Countdown UX:** the Results View displays a live countdown from `expires_at` ("Deleted in 08:42"); at zero it shows an expired state with a "Scan another photo" button. |
| FR-DL-11 | **Concurrency:** per-token lock (file lock or in-process mutex map) so `/clean` and `/download` cannot race; `/clean` is idempotent (re-running returns the existing verified result). |
| FR-DL-12 | **Capacity guard:** global cap on live token dirs (default 200) and total tmp bytes (default 2 GB); beyond which `503 SERVER_BUSY`. |

---

## 6. API Specifications

**Base path:** `/api` · **Content type:** JSON unless noted · **Auth:** none · **CORS:** allow-list from `CORS_ORIGINS` env only (no `*`).

### 6.0 Conventions

**Standard error envelope (all non-2xx JSON responses):**

```json
{
  "ok": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "That photo is larger than 10 MB. Please choose a smaller JPEG.",
    "details": { "max_bytes": 10485760 }
  }
}
```

**Error code catalogue:**

| Code | HTTP | Meaning |
|------|------|---------|
| `NO_FILE` | 400 | No `image` part in the request |
| `INVALID_TOKEN` | 400 | Token fails regex |
| `FILE_TOO_LARGE` | 413 | > 10 MB |
| `IMAGE_TOO_LARGE` | 413 | > 50 MP |
| `INVALID_SIGNATURE` | 415 | Missing `FF D8 FF` |
| `UNSUPPORTED_TYPE` | 415 | MIME or extension not JPEG |
| `CORRUPT_IMAGE` | 422 | Pillow cannot decode |
| `TRUNCATED_JPEG` | 422 | Missing/invalid EOI |
| `MALFORMED_STRUCTURE` | 422 | Segment chain invalid |
| `TOKEN_NOT_FOUND` | 404 | Unknown, consumed, or purged token |
| `TOKEN_EXPIRED` | 410 | TTL elapsed |
| `NOT_ANALYZED` | 409 | `/clean` called before successful analyze |
| `NOT_VERIFIED` | 409 | Download before verification passed |
| `VERIFICATION_FAILED` | 500 | One or more verification checks failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_BUSY` | 503 | Capacity guard tripped |
| `INTERNAL_ERROR` | 500 | Unexpected; generic message, no stack trace |

All responses include `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and a baseline CSP on the API (`default-src 'none'`).

---

### 6.1 `GET /api/health`

Liveness/readiness check. No auth, no side effects.

**Response `200`:**

```json
{
  "ok": true,
  "service": "shadowtrace-api",
  "version": "1.0.0",
  "status": "healthy",
  "limits": {
    "max_upload_bytes": 10485760,
    "max_megapixels": 50,
    "token_ttl_seconds": 600
  },
  "supported_formats": ["image/jpeg"],
  "active_sessions": 3
}
```

---

### 6.2 `POST /api/analyze`

Upload, validate, extract, score. Creates the token directory.

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `image` | file | yes | JPEG ≤ 10 MB, ≤ 50 MP |

**Response `200`:**

```json
{
  "ok": true,
  "token": "q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA",
  "created_at": "2026-10-16T09:30:00Z",
  "expires_at": "2026-10-16T09:40:00Z",
  "ttl_seconds": 600,
  "file": {
    "size_bytes": 3482113,
    "width": 4032,
    "height": 3024,
    "megapixels": 12.19,
    "format": "JPEG"
  },
  "risk": {
    "level": "high",
    "score": 100,
    "flags": {
      "gps": true,
      "timestamp": true,
      "device": true,
      "serial": false,
      "software": true,
      "thumbnail": true,
      "author": false,
      "comment": false,
      "technical_only": false
    },
    "reasons": [
      {
        "code": "GPS_PRESENT",
        "severity": "high",
        "title": "Exact location found",
        "plain_text": "This photo contains the exact GPS location where it was taken (47.620422, -122.349358). Anyone who receives the original file could find this place."
      },
      {
        "code": "TIMESTAMP_PRESENT",
        "severity": "medium",
        "title": "Date and time found",
        "plain_text": "The photo records when it was taken (2026-10-12 18:41:07), which can reveal your routines."
      },
      {
        "code": "DEVICE_ID_PRESENT",
        "severity": "medium",
        "title": "Device identified",
        "plain_text": "The camera make and model (Apple iPhone 15 Pro) are embedded."
      }
    ]
  },
  "metadata": {
    "location": [
      { "tag": "GPSLatitude",  "label": "Latitude",  "value": "47.620422", "raw": "47 deg 37' 13.52\" N", "source": "exif", "risk": "high" },
      { "tag": "GPSLongitude", "label": "Longitude", "value": "-122.349358", "raw": "122 deg 20' 57.69\" W", "source": "exif", "risk": "high" },
      { "tag": "GPSAltitude",  "label": "Altitude",  "value": "56.4 m", "raw": "5640/100", "source": "exif", "risk": "high" }
    ],
    "capture": [
      { "tag": "DateTimeOriginal", "label": "Taken on", "value": "2026-10-12 18:41:07", "source": "exif", "risk": "medium" },
      { "tag": "ExposureTime", "label": "Shutter speed", "value": "1/120 s", "source": "exif", "risk": "low" },
      { "tag": "FNumber", "label": "Aperture", "value": "f/1.8", "source": "exif", "risk": "low" },
      { "tag": "ISOSpeedRatings", "label": "ISO", "value": "64", "source": "exif", "risk": "low" }
    ],
    "device": [
      { "tag": "Make", "label": "Camera make", "value": "Apple", "source": "exif", "risk": "medium" },
      { "tag": "Model", "label": "Camera model", "value": "iPhone 15 Pro", "source": "exif", "risk": "medium" },
      { "tag": "Software", "label": "Software", "value": "17.5.1", "source": "exif", "risk": "medium" }
    ],
    "image": [
      { "tag": "ImageWidth", "label": "Width", "value": "4032 px", "source": "file", "risk": "none" },
      { "tag": "ImageLength", "label": "Height", "value": "3024 px", "source": "file", "risk": "none" },
      { "tag": "Orientation", "label": "Orientation", "value": "6 (Rotate 90° CW)", "source": "exif", "risk": "none" },
      { "tag": "ICCProfile", "label": "Colour profile", "value": "Display P3", "source": "icc", "risk": "none" }
    ]
  },
  "gps": {
    "present": true,
    "valid": true,
    "latitude": 47.620422,
    "longitude": -122.349358,
    "altitude_m": 56.4
  },
  "segments": [
    { "marker": "APP0",  "name": "JFIF",  "offset": 2,    "length": 16,    "removable": false },
    { "marker": "APP1",  "name": "EXIF",  "offset": 20,   "length": 12544, "removable": true },
    { "marker": "APP1",  "name": "XMP",   "offset": 12566,"length": 2310,  "removable": true },
    { "marker": "APP2",  "name": "ICC_PROFILE", "offset": 14878, "length": 3144, "removable": false },
    { "marker": "COM",   "name": "Comment", "offset": 18024, "length": 0,  "removable": true }
  ],
  "orientation": { "value": 6, "requires_reencode": true },
  "thumbnail": { "present": true, "size_bytes": 8120, "width": 160, "height": 120 },
  "warnings": [],
  "previews": {
    "original": "/api/preview/q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA/original"
  }
}
```

**Errors:** `NO_FILE`, `FILE_TOO_LARGE`, `IMAGE_TOO_LARGE`, `INVALID_SIGNATURE`, `UNSUPPORTED_TYPE`, `CORRUPT_IMAGE`, `TRUNCATED_JPEG`, `MALFORMED_STRUCTURE`, `RATE_LIMITED`, `SERVER_BUSY`.

**Notes:** When no metadata is found, `risk.level = "none"`, `reasons = [{ "code": "NO_METADATA", ... }]`, and all `metadata.*` arrays except `image` are empty. Coordinates appear only in this response body; they are never logged.

---

### 6.3 `POST /api/clean`

Strip, verify, and mark the token downloadable.

**Request:** `application/json`

```json
{ "token": "q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA" }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `token` | string | yes | From `/api/analyze`; must be live and analyzed |

**Response `200` (verification passed):**

```json
{
  "ok": true,
  "token": "q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA",
  "expires_at": "2026-10-16T09:40:00Z",
  "method": "reencode_orientation",
  "method_note": "This photo was rotated using hidden orientation data. To keep it upright, ShadowTrace re-saved it at very high quality.",
  "pixels_identical": false,
  "hashes": { "before": "9f2c41ab07de", "after": "51d0e8c3aa19" },
  "color_preserved": true,
  "size": { "original_bytes": 3482113, "cleaned_bytes": 3301442, "saved_bytes": 180671 },
  "removed": [
    { "name": "EXIF", "bytes": 12544 },
    { "name": "XMP", "bytes": 2310 },
    { "name": "COMMENT", "bytes": 0 },
    { "name": "TRAILING_DATA", "bytes": 0 }
  ],
  "preserved": ["JFIF", "ICC_PROFILE"],
  "verification": {
    "verified": true,
    "checks": [
      { "id": "V1", "name": "Segment audit",        "passed": true },
      { "id": "V2", "name": "exifread scan",        "passed": true },
      { "id": "V3", "name": "Pillow scan",          "passed": true },
      { "id": "V4", "name": "Raw byte-pattern scan","passed": true }
    ]
  },
  "download_url": "/api/download/q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA",
  "previews": {
    "original": "/api/preview/q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA/original",
    "cleaned":  "/api/preview/q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA/cleaned"
  }
}
```

For the lossless path: `"method": "lossless_rewrite"`, `"pixels_identical": true`, `"method_note": null`.

**Response `500` (verification failed — no download issued):**

```json
{
  "ok": false,
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "We couldn't confirm all hidden data was removed, so no download was created. Please try again or use a different photo.",
    "details": {
      "checks": [
        { "id": "V1", "name": "Segment audit", "passed": true },
        { "id": "V2", "name": "exifread scan", "passed": false },
        { "id": "V3", "name": "Pillow scan", "passed": true },
        { "id": "V4", "name": "Raw byte-pattern scan", "passed": true }
      ]
    }
  }
}
```

**Errors:** `INVALID_TOKEN`, `TOKEN_NOT_FOUND`, `TOKEN_EXPIRED`, `NOT_ANALYZED`, `VERIFICATION_FAILED`, `RATE_LIMITED`.

---

### 6.4 `GET /api/download/<token>`

Streams the verified cleaned JPEG and **consumes** the token.

**Path param:** `token` (43-char URL-safe string).

**Response `200`:** binary body.

```
Content-Type: image/jpeg
Content-Disposition: attachment; filename="shadowtrace_clean_a1b2c3d4.jpg"
Content-Length: 3301442
Cache-Control: no-store, max-age=0
X-Content-Type-Options: nosniff
```

After the stream closes, the entire token directory is deleted.

**Errors (JSON envelope):** `INVALID_TOKEN` (400), `TOKEN_NOT_FOUND` (404 — includes already-downloaded), `TOKEN_EXPIRED` (410), `NOT_VERIFIED` (409).

---

### 6.5 `GET /api/preview/<token>/<which>`

Serves a metadata-free display preview.

**Path params:**

| Param | Values |
|-------|--------|
| `token` | 43-char URL-safe string |
| `which` | `original` \| `cleaned` (strict allow-list; anything else → `404`) |

**Response `200`:** `image/jpeg` (re-encoded, max 1,200 px longest edge, no EXIF/XMP/ICC-text), headers:

```
Content-Type: image/jpeg
Content-Disposition: inline
Cache-Control: no-store
X-Content-Type-Options: nosniff
```

**Errors:** `INVALID_TOKEN` (400), `TOKEN_NOT_FOUND` (404 — also when `which=cleaned` and no cleaned file exists), `TOKEN_EXPIRED` (410).

Does **not** consume the token.

---

### 6.6 `/api/session/<token>`

#### `GET /api/session/<token>` — session status

**Response `200`:**

```json
{
  "ok": true,
  "token": "q3ZyWb1b0lT9Xx2mRk8nUa5oJcDfVhGeLpIsNtYwMzA",
  "status": "cleaned",
  "analyzed": true,
  "cleaned": true,
  "verified": true,
  "downloadable": true,
  "created_at": "2026-10-16T09:30:00Z",
  "expires_at": "2026-10-16T09:40:00Z",
  "seconds_remaining": 417
}
```

`status` ∈ `analyzed | cleaning | cleaned | failed`.

#### `DELETE /api/session/<token>` — purge now

**Response `200`:**

```json
{ "ok": true, "deleted": true }
```

Idempotent: an unknown/already-purged token also returns `200` with `"deleted": false` (does not reveal token existence).

**Errors:** `INVALID_TOKEN` (400), `TOKEN_NOT_FOUND` (404, GET only), `TOKEN_EXPIRED` (410, GET only).

---

## 7. Security Threat Model

**Assets:** user photos (and the metadata within), GPS coordinates, server availability, server filesystem integrity.
**Adversaries:** malicious uploader (attacks server), network observer, curious co-tenant/other user, automated scanners/botnets.

### 7.1 Threat Table

| ID | Threat | Vector | Mitigations (required) | Test |
|----|--------|--------|------------------------|------|
| **T1** | **Decompression bomb** | Tiny JPEG with huge declared dimensions exhausts RAM/CPU | SOF header parsed **before** decode; reject > 50 MP; `Image.MAX_IMAGE_PIXELS = 50_000_000`; `DecompressionBombWarning` escalated to error; 10 MB size cap; request timeout; worker memory limit (gunicorn `--max-requests`, container mem limit); decode only once, in a bounded context | 65,500×65,500 header-only bomb ⇒ `IMAGE_TOO_LARGE` in < 200 ms, RSS flat |
| **T2** | **Path traversal** | Filename like `../../etc/passwd`, tokens with `../`, `%2e%2e`, absolute paths, symlinks | Client filename **never** used for paths; server-generated fixed names (`original.jpg`, `cleaned.jpg`); token regex `^[A-Za-z0-9_-]{43}$`; `which` allow-list; resolved path must satisfy `os.path.realpath(p).startswith(TMP_ROOT + os.sep)`; no symlink following (`O_NOFOLLOW` where available); tmp root dedicated and non-web-served | Fuzz tokens (`..`, `%00`, unicode, 1 MB strings) ⇒ 400/404, no FS access outside root |
| **T3** | **MIME spoofing / polyglot** | `.php`/HTML/SVG/PNG/ZIP renamed to `.jpg`; JPEG-ZIP polyglot; wrong `Content-Type` | Triple gate: magic bytes `FF D8 FF` **and** declared MIME **and** extension; full Pillow decode; strict segment-chain parser; cleaner truncates after EOI (kills appended payloads); outputs always served as `image/jpeg` with `nosniff` and `attachment` disposition; never served from a static directory | Polyglot fixtures (JPEG+ZIP, JPEG+HTML trailer) ⇒ trailer removed in output; HTML-as-jpg ⇒ rejected |
| **T4** | **Log leakage / log sanitization** | Metadata, GPS, filenames, or tokens written to logs/exception traces | Custom `logging_safe` filter: log only request id, route, status, duration, byte counts, risk **level**, error **code**; **never** log filenames, tags, coordinates, tokens (log `token[:6]…`), or raw exception messages from parsers; strip control chars/newlines from any logged client string (anti log-injection); disable Werkzeug debug; generic 500 body; no stack traces to clients; log retention note in README | Test harness greps captured logs for fixture GPS/make/model/filename strings ⇒ zero hits |
| **T5** | Malicious metadata content (XSS) | Script tags in EXIF/IPTC/XMP/COM strings reflected in UI | Server returns JSON strings only; control-char scrub and length caps; React renders as text (no `dangerouslySetInnerHTML`); CSP on the frontend host `default-src 'self'; img-src 'self' blob: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' <api-origin>`; | Fixture with `<script>alert(1)</script>` in Comment/XMP ⇒ rendered inert |
| **T6** | XML attacks via XMP (XXE, billion laughs) | Hostile XMP packet | No DTD/external-entity resolution; hardened parser or regex scan only; XMP packet size cap (e.g., 1 MB); parse time budget | Billion-laughs XMP fixture ⇒ no expansion, bounded time |
| **T7** | Parser DoS | Cyclic/oversized IFD offsets, giant segment lengths, millions of tiny segments | Visited-offset set for IFD chains; max IFDs, max tags per IFD (e.g., 2,000), max segments (e.g., 5,000); all lengths bounds-checked against file size; 2 s parse budget; worker timeout | Crafted cyclic-IFD fixture ⇒ terminates with warning |
| **T8** | Token guessing / enumeration | Brute-forcing `/download/<token>` | 256-bit tokens; uniform `404` for unknown vs consumed; per-IP rate limit; constant-time compare not needed (lookup by directory name) but no existence side-channels in `DELETE`; tokens never logged in full | Statistical test: random tokens ⇒ 404 uniform timing |
| **T9** | Residual-data retention (privacy failure) | Files left on disk after crash/TTL/error | Janitor sweep every 30 s; boot-time full purge; purge on error paths (`try/finally`); consume-on-download; `DELETE /session`; tmp dir on tmpfs where available; no backups of tmp; optional secure-overwrite is **out of scope** (documented) | SC-05 lifecycle tests, crash-simulation test |
| **T10** | Race conditions | Concurrent clean/download/purge | Per-token lock; atomic `os.replace` for outputs; status machine in `state.json` | Parallel request stress test |
| **T11** | Resource exhaustion (disk/CPU) | Mass uploads | Per-IP rate limit; global session cap & tmp byte cap (`SERVER_BUSY`); `MAX_CONTENT_LENGTH`; worker concurrency limits | Load test at 5× expected traffic |
| **T12** | Cross-origin abuse / CSRF | Third-party site calls the API | CORS allow-list of exact origins; no cookies/sessions (CSRF surface nil); `/clean` and `/session DELETE` require possession of an unguessable token | CORS preflight test with foreign origin ⇒ blocked |
| **T13** | Privacy leaks by the product itself | Map tiles, fonts CDN, analytics, referrer leaks | **No** third-party requests (SC-08); no map rendering; self-hosted assets; `Referrer-Policy: no-referrer`; no `localStorage` of results; previews re-encoded metadata-free; HTTPS + HSTS in production | Playwright asserts only same-origin requests |
| **T14** | Cleaner failure (metadata survives) | Bug/unknown vendor segment | Independent 4-point verifier with **block-on-fail**; allow-list (not deny-list) of preserved markers in V1 segment audit; trailing-data truncation; fuzz corpus including vendor APPn | SC-02 sabotage test |
| **T15** | Dependency / supply-chain | Vulnerable Pillow/exifread/etc. | Pinned versions in `requirements.txt`/`package-lock.json`; CI audit (`pip-audit`, `npm audit`); Dependabot-style updates; Pillow kept current (image-parser CVEs) | CI gate |
| **T16** | HTTP header/response injection | User-controlled values in headers | Download filename server-generated; no reflection of client input in headers | Header-fuzz test |

### 7.2 Security Headers (API & static host)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains   (production)
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Cache-Control: no-store            (all /api responses)
Cross-Origin-Resource-Policy: same-site
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

### 7.3 Configuration (`backend/.env.example`)

```
FLASK_ENV=production
SECRET_KEY=change-me                 # not used for sessions; reserved
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_BYTES=10485760
MAX_MEGAPIXELS=50
TOKEN_TTL_SECONDS=600
JANITOR_INTERVAL_SECONDS=30
RATE_LIMIT_PER_MINUTE=30
MAX_LIVE_SESSIONS=200
TMP_ROOT=./tmp
```

---

## 8. Step-by-Step Milestones (M1 – M8)

Each milestone is complete only when **every** acceptance criterion passes. Implement in order; do not begin the next until the current is green.

### M1 — Project Scaffolding & Design System Foundation

**Deliver:** repo structure (§3.3), Vite + React 18 + Tailwind + router + Lucide setup, Flask app factory with `/api/health`, CORS allow-list, safe error handler, safe logging filter, `.env.example` files, README skeleton.

**Acceptance criteria:**
- [ ] `npm run dev` and `python run.py` both start; Vite proxy reaches `/api/health` and the UI shows a healthy status in a dev-only footer element removed by M8.
- [ ] Tailwind tokens from §4.2 configured; ambient background renders with `#FDFBF7` and peach glows; no dark mode class anywhere.
- [ ] `/api/health` returns the exact schema in §6.1.
- [ ] Unknown API route returns the §6.0 error envelope (JSON, not HTML).
- [ ] Log capture test passes: no sensitive strings logged (T4 baseline).

### M2 — Application Shell, Navigation & Static Pages

**Deliver:** `Header`, `Footer`, `AppShell`, routes (`/`, `/scanner`, `/results`, `/guide`, `/about`, `*`), `PrivacyGuide` and `About` pages.

**Acceptance criteria:**
- [ ] FR-NAV-01…07 pass; mobile menu is keyboard accessible.
- [ ] About page contains **zero** package/dependency/framework names (automated text grep for `react`, `flask`, `pillow`, `npm`, `pip`, `tailwind`, `vite`, `exifread` returns no matches in rendered About/Guide text).
- [ ] Lighthouse accessibility ≥ 95 on `/`, `/about`, `/guide`.
- [ ] Zero third-party network requests (SC-08 baseline).

### M3 — Landing Page & Upload Experience

**Deliver:** hero layout, `UploadZone`, `FileStatus`, benefit cards, floating upload card, client hints, `ScanProvider` with `startAnalyze` wired to a mocked API client.

**Acceptance criteria:**
- [ ] FR-LAND-01…08 pass at 375 px, 768 px, 1280 px widths (visual review + Playwright screenshots).
- [ ] Drag-and-drop and keyboard file selection both work; remove-file resets state.
- [ ] CTA disabled/enabled/loading states correct; error banner displays mapped friendly text per code.
- [ ] No `localStorage`/`sessionStorage`/cookie writes (asserted in test).
- [ ] Visual spec checks: white `rounded-2xl/3xl` cards, amber CTA, two-tone H1, icon badges `w-12 h-12 rounded-xl`.

### M4 — Backend Validation, Segment Scanner & Storage

**Deliver:** `validation.py`, `jpeg_segments.py` (scanner), `storage.py`, `POST /api/analyze` (validation + storage only, metadata fields stubbed).

**Acceptance criteria:**
- [ ] FR-UP-01…11 each have a passing positive and negative test (SC-07 = 100%).
- [ ] Decompression-bomb fixture rejected in < 200 ms with flat memory (T1).
- [ ] Path-traversal and token-fuzz suite passes (T2); token regex enforced.
- [ ] Polyglot and MIME-spoof fixtures behave per T3.
- [ ] Token directories are created with `0700`, hold only server-named files, and `state.json` contains no metadata.
- [ ] Segment scanner correctly lists segments for ≥ 20 fixtures (baseline, progressive, with ICC, with restart markers, with trailing data, CMYK/Adobe).

### M5 — Metadata Extraction & Risk Engine

**Deliver:** `metadata.py` (EXIF/GPS/XMP/IPTC/COM/thumbnail), `risk.py`, full `/api/analyze` response (§6.2), `Results` page with `RiskMeter`, `MetadataTable` (4 categories), `ImagePreviewCard`, preview endpoint.

**Acceptance criteria:**
- [ ] SC-01 passes (100% of GPS fixtures ⇒ High; all branch/precedence tests in FR-RISK-07 green).
- [ ] GPS conversion accurate to 6 decimals against known fixtures (including S/W hemispheres, altitude below sea level).
- [ ] XMP-only GPS and IPTC-only location fixtures detected; XXE/billion-laughs fixtures harmless (T6).
- [ ] Cyclic IFD / giant-length fixtures terminate within the 2 s budget (T7).
- [ ] Hostile strings (`<script>`, control chars, 100 KB comment) are sanitized and render inert in UI (T5).
- [ ] Results page shows 3-stage bar, reasons in plain language, four metadata tables, original preview (metadata-free recode per FR-DL-08), and **no map**.
- [ ] `/api/analyze` response validates against the §6.2 schema (JSON-schema test).

### M6 — Lossless Cleaner & Orientation Fallback

**Deliver:** `cleaner.py`, `POST /api/clean` cleaning (verification stubbed to pass), `CleanPanel`, before/after summary.

**Acceptance criteria:**
- [ ] SC-03: pixel hash identical for all non-orientation fixtures.
- [ ] SC-04: ICC and JFIF byte-identical when present.
- [ ] Trailing data after EOI removed; vendor APPn, XMP, Extended XMP, IPTC, COM, thumbnails removed (segment diff test).
- [ ] Orientation 2–8 fixtures take the `reencode_orientation` path, render upright in a reference viewer, retain ICC, contain no EXIF, and the UI shows the explanatory note.
- [ ] Output is written atomically; no partial `cleaned.jpg` observable under concurrent polling.
- [ ] `/api/clean` is idempotent and per-token locked (T10 stress test).

### M7 — Independent Verification & Ephemeral Download Lifecycle

**Deliver:** `verifier.py` (V1–V4), verification gating, `GET /api/download/<token>`, `DELETE`/`GET /api/session/<token>`, `janitor.py`, countdown UI, verification checklist UI, cleaned-image preview.

**Acceptance criteria:**
- [ ] SC-02: all fixtures pass V1–V4; a deliberately sabotaged cleaner (leaves one EXIF byte/serial string) triggers `VERIFICATION_FAILED` and **no download is possible** (`NOT_VERIFIED`/`409`).
- [ ] V4 detects residual original Make/Model/serial/GPS byte patterns planted in a comment-free region.
- [ ] SC-05: TTL and janitor tests using an injectable clock — token dir gone ≤ TTL + 60 s; boot purge removes seeded stale dirs; download consumes and removes the entire directory; second download ⇒ `404`.
- [ ] Download response headers exactly per FR-DL-07; filename server-generated.
- [ ] Capacity guard returns `503 SERVER_BUSY` when caps exceeded.
- [ ] UI: checklist of four verified items shown before the Download button; countdown reaches expiry state gracefully; "Start over" calls `DELETE` and clears state.
- [ ] Crash-simulation test leaves no orphan beyond one janitor cycle.

### M8 — Hardening, QA, Documentation & Release

**Deliver:** security headers/CSP, rate limiting, full test suites, performance pass, accessibility pass, `README.md` (technical specs, setup, dependency list, deployment, threat-model summary), production build config (gunicorn + static host), CI workflow.

**Acceptance criteria:**
- [ ] All eight Success Criteria **SC-01 … SC-08** demonstrably pass; results recorded in `README.md` ("Verification report").
- [ ] SC-06: p95 ≤ 3 s for a 10 MB / 12 MP JPEG (benchmark script output committed).
- [ ] Every row of the §7.1 threat table has a passing automated or documented manual test.
- [ ] Security headers per §7.2 present; CORS rejects non-allow-listed origins.
- [ ] `pip-audit` and `npm audit` show no high/critical findings; dependency versions pinned.
- [ ] End-to-end Playwright flow passes on Chromium, Firefox, WebKit: upload GPS photo → High risk → clean → 4 checks → download → token consumed → re-download `404`.
- [ ] UI audit: no dark mode, no terminal/grid/glow-green styling, no developer boilerplate on the UI; About page remains consumer-facing; all technical specs live only in `README.md`.
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 on `/` and `/scanner`.
- [ ] Final manual privacy walkthrough: browser network tab shows only same-origin requests; server `tmp/` is empty 11 minutes after the last test upload.

---

## Appendix A — Fixture Corpus (required for tests)

| Fixture | Purpose |
|---------|---------|
| `gps_iphone.jpg` | High risk, orientation 6, ICC Display P3 |
| `gps_negative_hemisphere.jpg` | S/W hemisphere sign handling |
| `xmp_gps_only.jpg` | GPS exclusively in XMP |
| `iptc_location_only.jpg` | Medium via IPTC |
| `timestamp_only.jpg` | Medium via DateTimeOriginal |
| `device_serial.jpg` | Medium via serial/model |
| `thumbnail_only.jpg` | Medium via IFD1 thumbnail |
| `technical_only.jpg` | Low (ISO/aperture/focal length) |
| `no_metadata.jpg` | None / Clean |
| `progressive_exif.jpg` | Progressive JPEG segments between scans |
| `restart_markers.jpg` | DRI/RSTn preservation |
| `trailing_zip.jpg` | JPEG+ZIP polyglot |
| `trailing_html.jpg` | Appended HTML payload |
| `bomb_65k.jpg` | Header-claimed 65,500×65,500 |
| `cyclic_ifd.jpg` | IFD loop DoS |
| `xmp_billion_laughs.jpg` | XML entity expansion |
| `hostile_strings.jpg` | `<script>`, control chars, oversize COM |
| `cmyk_adobe.jpg` | APP14 Adobe preservation |
| `truncated.jpg` | Missing EOI |
| `fake_png_named_jpg.jpg` | Wrong magic bytes |

## Appendix B — Risk Reason Copy Deck (plain language)

| Code | Title | Message template |
|------|-------|------------------|
| `GPS_PRESENT` | Exact location found | "This photo contains the exact GPS location where it was taken ({lat}, {lon}). Anyone who receives the original file could find this place." |
| `TIMESTAMP_PRESENT` | Date and time found | "The photo records when it was taken ({datetime}), which can reveal your routines." |
| `DEVICE_ID_PRESENT` | Device identified | "The camera make and model ({make} {model}) are embedded." |
| `SERIAL_PRESENT` | Serial number found | "A device serial number is embedded, which can link photos to one specific camera or phone." |
| `SOFTWARE_PRESENT` | Software recorded | "The software or editing app ({software}) is recorded in the file." |
| `THUMBNAIL_PRESENT` | Hidden thumbnail found | "A small hidden preview image is stored inside the file. It can still show content you've cropped out." |
| `AUTHOR_INFO_PRESENT` | Author details found | "Author, credit, or copyright text is embedded in the file." |
| `COMMENT_PRESENT` | Hidden comment found | "A text comment is embedded in the file." |
| `TECHNICAL_ONLY` | Low-sensitivity camera settings | "Only general camera settings (like ISO and aperture) were found. These don't point to a person or place." |
| `NO_METADATA` | Nothing sensitive found | "No hidden metadata was found in this photo." |

*End of document.*
