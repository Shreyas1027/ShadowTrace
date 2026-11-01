# ShadowTrace: Visual Privacy Guard
## Comprehensive Engineering & Architecture Specification

> **Single Source of Truth** for Evaluation, Architecture Review, and Engineering Handover.  
> **Status:** Production-Ready (Milestones 1 through 7 Operational & Verified)

---

## 1. Project Identity & Metadata

| Attribute | Details |
| :--- | :--- |
| **Project Title** | **ShadowTrace: Visual Privacy Guard** |
| **Domain** | Digital Image Forensics, Metadata Privacy, Web Security |
| **Authors** | **Shreyas Choudhary**, **Shubham Mahanwar**, **Jagdish Bakle** |
| **Project Guide** | **Prof. Vinita Bhandiwad** |
| **Academic Department** | Department of Information Technology |
| **Institution** | **Vidyalankar Institute of Technology**, Wadala, Mumbai |
| **Version** | 1.0.0 (Release Candidate) |
| **Source Repository** | [https://github.com/Shreyas1027/ShadowTrace.git](https://github.com/Shreyas1027/ShadowTrace.git) |
| **Target Runtime** | Node.js v18+ (Frontend), Python 3.10+ (Backend WSGI/Flask) |

---

## 2. Executive Summary & Problem Statement

### 2.1 Why ShadowTrace Exists
Digital photography has evolved from simple raster generation into comprehensive telemetry logging. Whenever a consumer captures a photograph using a smartphone, digital camera, or drone, the capture device automatically records and injects deep identifying information directly into the file's binary stream. These invisible markers include:

- **Geographic Coordinates (GPS IFD):** Latitude, longitude, altitude, bearing, and timestamp to sub-meter accuracy.
- **Temporal Footprints:** `DateTimeOriginal`, `SubSecTimeOriginal`, and timezone offsets tracking user routines.
- **Device & Hardware Fingerprints:** Camera manufacturer, model, unique hardware body serial number (`BodySerialNumber`), lens serial number, and firmware version.
- **Embedded Visual Previews:** Undocumented Exif thumbnail images (`IFD1`) which frequently retain uncropped or pre-edited content even after the user has cropped the primary image.
- **Software & Author Signatures:** Photoshop / Lightroom history (`8BIM` / `APP13`), Adobe XMP packets, IPTC records, and freeform text comments (`COM`).

When shared on messaging platforms, forums, or classifieds, these artifacts expose users to geolocation tracking, burglary targeting, stalking, and identity correlation.

### 2.2 The Industry Gap
Existing approaches to metadata removal suffer from critical engineering compromises:
1. **Lossy DCT Re-encoding:** Standard graphics applications and consumer web scrubbers decompress the JPEG, decode entropy blocks to raw spatial pixels, discard Exif structures, and re-compress into a new JPEG. This irreversible lossy Discrete Cosine Transform (DCT) round-trip introduces generational compression artifacts, degrades edge acuity, alters color palettes, and alters high-frequency quantization tables.
2. **CLI Forensics Inaccessibility:** Low-level forensic command-line utilities (such as `exiftool` or `jhead`) are powerful, but their complex syntax, local terminal dependencies, and lack of visual risk explanation make them inaccessible to general, non-technical users.
3. **Data Harvesting & Cloud Retention Risk:** Most online "image cleaners" upload files to third-party cloud infrastructure, keeping copies in object storage, indexing user data, or executing third-party tracking scripts. The scrubber itself becomes the primary privacy hazard.

```
Existing Solutions vs. ShadowTrace:
┌─────────────────────────┬──────────────────────────────┬────────────────────────────┐
│ Approach                │ Visual Quality Impact        │ Privacy & Security Model   │
├─────────────────────────┼──────────────────────────────┼────────────────────────────┤
│ Traditional Web Scrubber│ Re-encoded (Lossy DCT)       │ Persistent Cloud Storage   │
│ Forensic CLI (ExifTool) │ Zero Loss (Lossless Rewriter)│ Terminal Required (No GUI) │
│ ShadowTrace             │ 100% Lossless Byte Excision  │ Zero Retention (Ephemeral) │
└─────────────────────────┴──────────────────────────────┴────────────────────────────┘
```

### 2.3 The ShadowTrace Solution
**ShadowTrace** is a zero-retention, provably lossless web application and forensic visual privacy guard. It parses binary JPEG streams directly, audits and highlights threat indicators using a deterministic risk engine, visualizes metadata categories without external map trackers, and losslessly excises non-essential metadata segments directly at the byte level with **zero pixel decompression**.

---

## 3. Architecture & Tech Stack

```
                     SHADOWTRACE SYSTEM TOPOLOGY

   [ Client Browser ]
   │
   ├─► React 18 + Vite (Tailwind CSS, Lucide React)
   │   ├── Drag-and-Drop Workspace & Client-Side Signature Hints
   │   ├── Dynamic Scan HUD & Plain-Language Risk Meter
   │   └── 4-Point Post-Clean Verification Card & State Reset
   │
   │   HTTPS / Reverse Proxy (/api/*)
   ▼
   [ Flask REST API Application Factory ]
   │
   ├── Security Headers Middleware (CSP, CORP, Permissions-Policy, HSTS)
   ├── Stream Validation & Header Dimension Inspector (SOF0/SOF2, 50 MP Limit)
   ├── Binary JPEG Segment Parser (APP0..APP15, COM, SOS Scanner)
   ├── Metadata Harvesting Pipeline (EXIF, GPS IFD, IPTC, XMP, Thumbnail)
   ├── Deterministic Risk Scoring Engine (0–100 Scale, High/Med/Low/Clean)
   ├── Lossless Segment Excision Engine (Direct Byte Rewriter)
   ├── Independent 4-Point Post-Clean Verifier (V1: Segment, V2: ExifRead, V3: Pillow, V4: Byte)
   ├── Pixel Invariance Validator (SHA-256 Raw RGB Invariance)
   │
   ▼
   [ Ephemeral Sandbox Storage ]
   └── tmp/<token>/
       ├── original.jpg (Mode 0700)
       ├── cleaned.jpg
       └── state.json (Metadata-free session ledger)
           ▲
           └─► Auto-purged by Background Janitor (TTL: 10 mins)
           └─► Immediately wiped on Download / Client-side Reset
```

### 3.1 Frontend Stack
- **Framework & Build:** **React 18** paired with **Vite 5** for millisecond HMR and highly optimized production builds.
- **Styling Architecture:** **Tailwind CSS 3** with custom tokens implementing a dedicated *Warm Canvas* design system (`#FDFBF7` canvas, amber `#F59E0B` primary accents, floating cards with ambient borders). Dark mode is explicitly forbidden to maintain high-contrast forensic clarity.
- **Iconography & Components:** **Lucide React** for crisp, contextual status indicators and forensic iconography.
- **State Management:** Custom React Context (`ScanProvider`) maintaining upload states, analysis payloads, verification summaries, and TTL countdown timers completely in volatile browser memory (no `localStorage`, no `sessionStorage`, no cookie writes).

### 3.2 Backend Stack
- **API Runtime:** **Python 3.10+** powering a modular **Flask** application factory with blueprint-separated domains (`health`, `analyze`/`scan`, `clean`, `download`, `preview`, `session`).
- **Low-Level Parsing:** Custom binary JPEG stream parser (`jpeg_segments.py`) capable of byte-level traversal of marker headers, length words, and entropy payloads.
- **Forensic Extraction Libraries:** **Pillow (PIL)** and **ExifRead** utilized for robust multi-standard tag normalization and safe extraction.
- **Production Server:** Python WSGI entry point (`wsgi.py`) ready for high-concurrency Gunicorn deployments behind Nginx or Cloudflare.

### 3.3 Security & Ephemeral Lifecycle Model
1. **Cryptographic Session Tokens:** Each upload generates an unguessable 43-character URL-safe base64 token (256-bit entropy via `secrets.token_urlsafe(32)`), strictly validated against `^[A-Za-z0-9_-]{43}$` to completely eliminate path-traversal vulnerabilities.
2. **Restricted Sandboxes:** Images are written to isolated POSIX directories under `backend/tmp/<token>` initialized with strict `0700` permissions.
3. **Automated 10-Minute Janitor:** A background thread sweeps `backend/tmp/` every 30 seconds, forcibly unlinking directories older than 600 seconds (`config.TOKEN_TTL_SECONDS`).
4. **Consume-on-Download:** Invoking `GET /api/download/<token>` streams the sanitized JPEG with attachment headers and immediately deletes the sandbox upon stream termination.
5. **Instant Reset (`DELETE /api/session/<token>`):** Clicking "Start Over" or closing the workspace triggers an immediate asynchronous wipe of the server sandbox.
6. **Zero Client Log Leaks:** Custom safe-logging filters intercept and redact filenames, session tokens, camera models, and GPS coordinates from standard outputs.

---

## 4. Algorithmic Formulation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 BYTE-LEVEL JPEG SEGMENT REWRITING ENGINE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Input Stream:                                                               │
│ [FF D8] SOI                                                                 │
│ [FF E0] APP0 (JFIF)       ──────────────► PRESERVED                         │
│ [FF E1] APP1 (EXIF / XMP) ──────────────► EXCISED (Metadata & Thumbnails)   │
│ [FF E2] APP2 (ICC Profile)──────────────► PRESERVED (Color Calibration)     │
│ [FF ED] APP13 (IPTC / 8BIM)─────────────► EXCISED (Editor History)          │
│ [FF DB] DQT               ──────────────► PRESERVED (Quantization Tables)   │
│ [FF C0] SOF0              ──────────────► PRESERVED (Frame Geometry)        │
│ [FF C4] DHT               ──────────────► PRESERVED (Huffman Tables)        │
│ [FF FE] COM               ──────────────► EXCISED (Comments)                │
│ [FF DA] SOS + Entropy     ──────────────► COPIED BYTE-FOR-BYTE              │
│ [FF D9] EOI               ──────────────► PRESERVED                         │
│ [Trailing Non-JPEG Data]  ──────────────► TRUNCATED (Zip/Exe Polyglot)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Byte-Level JPEG Segment Marker Stripping
The core innovation of ShadowTrace is its direct binary segment excision engine. Rather than re-encoding the image through a lossy DCT quantization matrix, ShadowTrace performs sequential byte scanning and reconstruction:

1. **Signature Verification:** The stream must begin with the Start of Image (SOI) marker `0xFF 0xD8`.
2. **Segment Classification:** Traverses the stream marker by marker. Each marker begins with `0xFF` followed by a marker code $M$ and a big-endian 16-bit unsigned length field $L_{\text{seg}} = \text{payload} + 2$:
   - **Excised Segments (Stripped):**
     - **APP1 (`0xFF 0xE1`):** Contains EXIF header (`Exif\x00\x00`), GPS Sub-IFDs, TIFF tags, embedded thumbnails (`IFD1`), and XMP metadata packets (`http://ns.adobe.com/xap/1.0/`).
     - **APP2 (`0xFF 0xE2` Non-ICC):** Excises FlashPix extensions (`FPXR`) and Multi-Picture Format previews (`MPF`).
     - **APP13 (`0xFF 0xED`):** Excises Photoshop Image Resource Blocks (8BIM) and IPTC records.
     - **COM (`0xFF 0xFE`):** Excises arbitrary user/system comment strings.
     - **Vendor APPn (`0xFF 0xE3`–`0xFF 0xEC`, `0xFF 0xEF`):** Excises proprietary vendor tags.
   - **Preserved Structural Segments:**
     - **APP0 (`0xFF 0xE0`):** Retains `JFIF\x00` and `JFXX\x00` headers specifying density and aspect ratio.
     - **APP2 (`0xFF 0xE2` ICC):** Explicitly detects and preserves `ICC_PROFILE\x00` packets to guarantee that display profiles (e.g., Apple Display P3, Adobe RGB) remain identical.
     - **APP14 (`0xFF 0xEE`):** Preserves `Adobe\x00` color transform indicators required for correct CMYK/YCCK color decoding.
     - **Tables & Frame:** Preserves Quantization Tables (`DQT`, `0xFF 0xDB`), Huffman Tables (`DHT`, `0xFF 0xC4`), Restart Intervals (`DRI`, `0xFF 0xDD`), and Frame Headers (`SOF0`..`SOF15`).
3. **Entropy Preservation:** Upon encountering Start of Scan (`SOS`, `0xFF 0xDA`), the segment header and the entire subsequent entropy-coded compressed scan data are copied verbatim without evaluating DCT coefficients.
4. **Trailing Data Truncation:** Scanning halts strictly upon locating End of Image (`EOI`, `0xFF 0xD9`). Any trailing binary data appended after `EOI` (e.g., hidden ZIP payloads, appended malware, or staging data) is permanently truncated.

### 4.2 GPS DMS-to-Decimal Degree Conversion
EXIF GPS coordinates are structured as three rational tuples `(Degrees, Minutes, Seconds)` where each rational is a pair of unsigned 32-bit integers $(\text{Numerator}, \text{Denominator})$. ShadowTrace executes the following deterministic floating-point transformation:

$$\text{DD} = \left( \text{Deg} + \frac{\text{Min}}{60.0} + \frac{\text{Sec}}{3600.0} \right) \times S$$

Where the hemispheric sign multiplier $S$ is computed as:
$$S = \begin{cases} -1.0, & \text{if } \text{Ref} \in \{'S', 'W'\} \\ +1.0, & \text{if } \text{Ref} \in \{'N', 'E'\} \end{cases}$$

Calculations are rounded to exactly 6 decimal places ($10^{-6}$ degrees, providing $\approx 0.11\text{ m}$ ground resolution at the equator), verified against negative hemisphere coordinates (e.g., Southern and Western latitudes/longitudes).

### 4.3 Deterministic Risk Scoring Engine
The system evaluates extracted metadata using a rule-based engine that outputs a composite risk tier (`high`, `medium`, `low`, `none`) and an integer score $R \in [0, 100]$:

```
Risk Evaluation Hierarchy:
  ┌──────────────────────────────────────────────┐
  │ GPS Present?                                 │───► HIGH RISK (Score = 100)
  └──────────────────────┬───────────────────────┘
                         │ No
  ┌──────────────────────▼───────────────────────┐
  │ Device Model, Serial, Timestamp, Thumbnail,  │───► MEDIUM RISK (Score = 60)
  │ Software, or Comments Present?               │
  └──────────────────────┬───────────────────────┘
                         │ No
  ┌──────────────────────▼───────────────────────┐
  │ Technical Camera Settings Only (ISO, Shutter)│───► LOW RISK (Score = 25)
  └──────────────────────┬───────────────────────┘
                         │ No
  ┌──────────────────────▼───────────────────────┐
  │ Zero Metadata Tags Present                   │───► CLEAN (Score = 0)
  └──────────────────────────────────────────────┘
```

| Risk Level | Score Range | Primary Triggers | Privacy Hazard Description |
| :--- | :---: | :--- | :--- |
| **High** | $80 - 100$ | GPS IFD coordinates, GPS timestamps, altitude | Pinpoints physical location, residential addresses, and routines. |
| **Medium** | $40 - 79$ | `Make`, `Model`, `BodySerialNumber`, `DateTimeOriginal`, Embedded Thumbnails | Identifies physical equipment, links files across the web, exposes pre-cropped content. |
| **Low** | $10 - 39$ | ISO speed, Focal length, F-number, Exposure time | Exposes professional capture habits without revealing location or identity. |
| **Clean** | $0$ | Verified zero metadata tags | Sanitized photo suitable for public broadcast. |

### 4.4 Cryptographic Pixel Array Invariance
To provide mathematical certainty of zero quality degradation, ShadowTrace calculates the cryptographic SHA-256 digest of the decoded raw uncompressed RGB pixel bytes:

$$\text{Array}_{\text{RGB}} = \text{Image}.\text{convert}("RGB").\text{tobytes}()$$
$$\mathcal{H} = \text{SHA-256}(\text{Array}_{\text{RGB}})$$

Verification condition:
$$\mathcal{H}(\text{Pixel}_{\text{original}}) \equiv \mathcal{H}(\text{Pixel}_{\text{cleaned}})$$

If the condition holds, the image is mathematically identical at the spatial pixel level (0% distortion, $\text{PSNR} = \infty$).

> **Orientation Fallback Guarantee:** If EXIF orientation is rotated ($2 \le \text{Orientation} \le 8$), simply discarding the metadata would render the cleaned image sideways or upside-down. ShadowTrace detects this edge case, applies a lossless spatial transposition (`ImageOps.exif_transpose`), saves at maximum quality ($Q=95$, preserving the ICC profile), and informs the user via UI disclosures.

---

## 5. Milestones Completed (1 through 7)

```
===================================================================================
                   SHADOWTRACE MILESTONE IMPLEMENTATION PROGRESS
===================================================================================
[✓] M1: Scaffolding, App Factory & Health API
[✓] M2: Shell Architecture, Navigation & Plain-Language Guides
[✓] M3: Interactive Upload Workspace, Client Dropzone & State Machine
[✓] M4: Binary Magic Byte Validation, SOF Dimension Guard & Sandbox Storage
[✓] M5: Multi-standard Metadata Extraction & Deterministic Risk Scoring
[✓] M6: Byte-Level Lossless Stripping Engine & Ephemeral Download
[✓] M7: Independent 4-Point Verification Engine & Client State Reset
===================================================================================
```

### Milestone 1: Project Scaffolding & Health API Integration
- Initialized unified workspace architecture separating client frontend and backend REST server.
- Built Flask application factory (`create_app`) with strict CORS origin restriction, secure error handler envelopes, and log sanitization filters.
- Implemented `GET /api/health` providing service status, file limits, Megapixel caps, and active session counters.
- Configured Tailwind CSS warm palette tokens (`#FDFBF7`) and Lucide React.

### Milestone 2: App Shell, Navigation & Privacy Guides
- Developed responsive navigation header with active-link indicators, mobile menu drawer, and keyboard accessibility.
- Implemented static educational guides:
  - **Privacy Guide (`/guide`):** Visual explanations of EXIF, GPS tracking risks, serial numbering, and hidden thumbnail dangers.
  - **About View (`/about`):** Consumer-facing mission statement with strict isolation from developer jargon.

### Milestone 3: Scanner UI Workspace & Client-Side Validation
- Built the interactive Drag-and-Drop workspace (`UploadZone.jsx`) supporting file picking, visual drop states, and instant remove-file resets.
- Engineered instant client-side validation rejecting non-JPEG files (`image/jpeg`) and files exceeding the 10 MB upload ceiling prior to network transmission.
- Created `ScanProvider.jsx` maintaining scan session states and errors entirely in memory.

### Milestone 4: Backend File Handling & Binary Magic Byte Validation
- Implemented strict multi-stage binary validation (`validation.py`):
  1. Filename extension checking (`.jpg`, `.jpeg`).
  2. Magic byte inspection verifying byte 0–2 matches `FF D8 FF`.
  3. Pre-decode SOF parsing (`parse_header_dimensions`) preventing decompression bombs by enforcing a strict 50 Megapixel limit without decompressing pixel arrays.
- Established POSIX-isolated ephemeral directory creation (`storage.py`) with permissions `0700`.

### Milestone 5: Metadata Extraction Pipeline & Risk Scoring Engine
- Implemented multi-format metadata harvester (`metadata.py`):
  - Extracted EXIF tags, GPS rational degrees, XMP packets, IPTC blocks, and IFD1 embedded thumbnails.
  - Sanitized hostile text strings to defeat XSS and control character injection.
- Implemented deterministic Risk Scoring Engine (`risk.py`):
  - Evaluates flags across location, temporal, hardware, and technical categories.
  - Returns structured reasons in plain language and categorizes results into High, Medium, Low, or Clean.
- Built interactive `Results.jsx` view with three-stage risk meter, categorized metadata drawers, and original preview.

### Milestone 6: Lossless Stripper Engine & Ephemeral Safe Download
- Created the byte-level segment rewriter (`strip_jpeg_metadata` in `cleaner.py`):
  - Strips APP1 (EXIF/XMP), APP13 (IPTC), COM, non-ICC APP2, and post-EOI trailing bytes.
  - Retains APP0 (JFIF), APP2 (ICC profile), APP14 (Adobe), and compressed scan entropy.
- Implemented orientation fallback re-encoding for photos taken with hardware rotation flags.
- Developed `POST /api/clean` executing the stripping pipeline and computing before/after SHA-256 pixel hashes.

### Milestone 7: 4-Point Post-Clean Verification & UI State Reset
- Engineered the independent 4-Point Verification Engine (`verification.py`):
  - **V1 (Segment Audit):** Validates all removable APPn segments are absent and EOI is uncorrupted.
  - **V2 (ExifRead Scan):** Independent pass with ExifRead asserting zero surviving tags.
  - **V3 (Pillow Scan):** Independent pass with PIL asserting empty EXIF and GPS IFD structures.
  - **V4 (Raw Binary Scan):** Byte-level pattern scanning ensuring forbidden sequences (`Exif\0\0`, `8BIM`, etc.) and harvested device strings do not exist in the pre-SOS header.
- Implemented secure ephemeral download (`GET /api/download/<token>`) enforcing consume-on-download directory purging.
- Integrated `DELETE /api/session/<token>` with client-side reset for instantaneous session destruction.

---

## 6. API Reference

All error responses adhere to the standard JSON error envelope:
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation.",
    "details": null
  }
}
```

### 6.1 `GET /api/health`
Verifies backend service liveness, operational limits, and session capacity.
- **Request:** None
- **Response `200 OK`:**
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
  "active_sessions": 0
}
```

---

### 6.2 `POST /api/scan` (Alias: `POST /api/analyze`)
Performs multi-stage file validation, stores the original file in an ephemeral sandbox, extracts all metadata blocks, and evaluates risk.
- **Content-Type:** `multipart/form-data`
- **Body:** `image` (binary file payload)
- **Response `200 OK`:**
```json
{
  "ok": true,
  "token": "E1p89_uX7...43_chars...wQ",
  "created_at": 1729000000.0,
  "expires_at": 1729000600.0,
  "ttl_seconds": 600,
  "file": {
    "size_bytes": 3145728,
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
      "serial": true,
      "thumbnail": true
    },
    "reasons": [
      {
        "code": "GPS_PRESENT",
        "severity": "high",
        "title": "Exact location found",
        "plain_text": "This photo contains the exact GPS location where it was taken (19.022200, 72.856100)."
      }
    ]
  },
  "metadata": {
    "device": [{"tag": "Model", "label": "Camera model", "value": "iPhone 13"}],
    "location": [{"tag": "GPSLatitude", "label": "Latitude", "value": "19° 1' 19.92\" N"}],
    "capture": [{"tag": "DateTimeOriginal", "label": "Date and time taken", "value": "2024:08:15 14:22:10"}],
    "image": [{"tag": "ColorSpace", "label": "Color space", "value": "sRGB"}]
  },
  "gps": {
    "present": true,
    "latitude": 19.0222,
    "longitude": 72.8561,
    "altitude_m": 14.5
  },
  "thumbnail": {
    "present": true,
    "width": 512,
    "height": 384
  }
}
```

---

### 6.3 `POST /api/clean`
Executes byte-level segment excision, verifies output through 4-point verification, calculates pixel hash invariance, and readies file for download.
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "token": "E1p89_uX7...43_chars...wQ"
}
```
- **Response `200 OK`:**
```json
{
  "ok": true,
  "token": "E1p89_uX7...43_chars...wQ",
  "status": "cleaned",
  "verified": true,
  "method": "lossless_rewrite",
  "method_note": null,
  "hashes": {
    "before": "a1b2c3d4e5f6",
    "after": "a1b2c3d4e5f6",
    "pixels_identical": true
  },
  "verification": {
    "all_passed": true,
    "checks": [
      {"id": "V1", "name": "Segment audit", "passed": true},
      {"id": "V2", "name": "exifread scan", "passed": true},
      {"id": "V3", "name": "Pillow scan", "passed": true},
      {"id": "V4", "name": "Raw byte-pattern scan", "passed": true}
    ],
    "sensitive_tags_remaining": 0,
    "risk_score_after": 0
  },
  "stats": {
    "original_size": 3145728,
    "cleaned_size": 3084288,
    "bytes_removed": 61440,
    "percent_reduction": 1.95
  },
  "download_url": "/api/download/E1p89_uX7...43_chars...wQ"
}
```

---

### 6.4 `GET /api/download/<token>`
Streams the cleaned, verified JPEG file and instantly triggers ephemeral session deletion.
- **Request:** Path parameter `token`
- **Response Headers:**
  - `Content-Type: image/jpeg`
  - `Content-Disposition: attachment; filename="<original_name>_clean.jpg"`
  - `Content-Length: <bytes>`
  - `Cache-Control: no-store, max-age=0`
- **Security Action:** Deletes token sandbox directory upon response completion (`consume-on-download`).

---

### 6.5 `DELETE /api/session/<token>`
Immediately purges the ephemeral sandbox directory and invalidates session token.
- **Request:** Path parameter `token`
- **Response `200 OK`:**
```json
{
  "ok": true,
  "deleted": true
}
```

---

## 7. Setup, Installation & Verification Guide

### 7.1 Prerequisites
- **Python:** v3.10 or higher
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **PowerShell / Bash**

---

### 7.2 Backend Configuration & Execution

```powershell
# 1. Navigate to workspace root
cd c:\Projects\ShadowTrace

# 2. Activate Python virtual environment
.\.venv\Scripts\Activate.ps1

# 3. Install required Python packages
pip install -r backend/requirements.txt

# 4. Initialize local configuration file
Copy-Item backend/.env.example backend/.env

# 5. Start development API server (runs on http://127.0.0.1:5000)
python backend/run.py
```

---

### 7.3 Frontend Configuration & Execution

In a separate terminal:

```powershell
# 1. Navigate to frontend directory
cd c:\Projects\ShadowTrace\frontend

# 2. Install NPM dependencies
npm install

# 3. Initialize environment variables
Copy-Item .env.example .env

# 4. Start Vite development server (runs on http://localhost:5173)
npm run dev
```

The frontend uses Vite's reverse proxy to route `/api/*` requests directly to `http://127.0.0.1:5000`.

---

### 7.4 Verification & Production Validation

#### 1. Backend Automated Test Suite
Execute the 30-case automated test suite covering all modules:
```powershell
.\.venv\Scripts\pytest backend/tests/ -v
```
*Expected Result:*
```
============================= 30 passed in 1.42s ==============================
```

#### 2. Frontend Production Build Integrity
Verify asset bundling, tree-shaking, and CSS compilation:
```powershell
cd c:\Projects\ShadowTrace\frontend
npm run build
```
*Expected Result:*
```
✓ 1591 modules transformed.
✓ built in ~3.4s
```

#### 3. Endpoint Health Verification
Check API liveness directly:
```powershell
curl http://127.0.0.1:5000/api/health
```
*Expected Result:* HTTP 200 with status `"healthy"`.

---

## 8. Summary of Engineering Achievements

ShadowTrace successfully bridges the gap between deep forensic accuracy and user-centric web privacy:
1. **Mathematical Losslessness:** Eliminates generational DCT re-compression artifacts through direct segment marker excision.
2. **Absolute Privacy Defense:** Guarantees zero long-term retention via volatile state management, POSIX-isolated sandboxes, 10-minute automated janitor sweeps, and instant consume-on-download destruction.
3. **Multi-Layer Forensic Verification:** Asserts that output JPEGs are 100% clean of tracking data across 4 independent auditing engines before allowing download.
4. **Accessible Threat Communication:** Translates cryptic hexadecimal and EXIF tags into clear, actionable privacy risk metrics for everyday users.

*Document generated and validated for the Department of Information Technology, Vidyalankar Institute of Technology, Mumbai.*
