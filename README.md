# ShadowTrace

> **Tagline:** *Know what your images reveal.*  
> **Status:** Milestone 1 (M1) Complete

ShadowTrace is a privacy-first web utility that inspects and removes hidden metadata from JPEG photographs (EXIF, GPS coordinates, device serial numbers, embedded thumbnails, XMP, IPTC, and comments) before sharing, guaranteeing zero quality loss and strict ephemeral retention.

---

## Technical Specifications

### Architecture
- **Frontend:** React 18, Vite, Tailwind CSS (AcademiX warm design system), Lucide React, React Router DOM.
- **Backend:** Python 3.10+, Flask REST API.
- **Image Processing & Verification:** Pillow, ExifRead, custom binary segment parser/writer (`jpeg_segments.py`).
- **Storage Lifecycle:** Ephemeral token directories (`0700`) with a 10-minute TTL, automated background janitor, and consume-on-download purge.
- **Privacy Guarantee:** Zero third-party requests, no database, no analytics, no persistent tracking, no server logs containing client metadata or GPS coordinates.

---

## Directory Structure

```
shadowtrace/
├── README.md                     # Technical specs, setup, dependency list
├── PRD.md                        # Authoritative product requirements
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js            # Dev proxy: /api -> http://127.0.0.1:5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Router + ScanProvider + M1 Health Banner
│       ├── index.css             # Tailwind layers, ambient warm canvas, tokens
│       ├── context/
│       │   └── ScanProvider.jsx  # In-memory scan state
│       ├── api/
│       │   └── client.js         # API fetch client
│       ├── layout/
│       ├── pages/
│       ├── components/
│       └── utils/
└── backend/
    ├── requirements.txt
    ├── .env.example
    ├── run.py                    # Development server entry point
    ├── wsgi.py                   # Production WSGI entry point
    ├── app/
    │   ├── __init__.py           # App factory, CORS, limits, security headers
    │   ├── config.py             # Environment config loader
    │   ├── routes/
    │   │   └── health.py         # GET /api/health
    │   ├── services/
    │   └── utils/
    │       ├── errors.py         # Standard JSON error envelopes
    │       └── logging_safe.py   # Sanitizing log filter (PRD T4)
    ├── tmp/                      # Runtime ephemeral token directories
    └── tests/
        └── test_api.py           # Test suite for health, headers, error envelope
```

---

## Getting Started

### Prerequisites
- **Node.js:** v18.0.0+ (Tested with v24.21.0)
- **npm:** v9.0.0+ (Tested with v11.19.0)
- **Python:** v3.10+ (Tested with v3.10.11)
- **Git**

### 1. Backend Setup & Startup

From the project root:

```powershell
# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Copy environment configuration
Copy-Item backend/.env.example backend/.env

# Run development server (runs on http://127.0.0.1:5000)
python backend/run.py
```

### 2. Frontend Setup & Startup

From the project root in a second terminal:

```powershell
cd frontend

# Install npm dependencies
npm install

# Copy environment configuration
Copy-Item .env.example .env

# Run Vite development server (runs on http://localhost:5173)
npm run dev
```

The frontend uses Vite's reverse proxy to route `/api/*` requests directly to `http://127.0.0.1:5000`.

### 3. Running Backend Tests

```powershell
.\.venv\Scripts\pytest backend/tests/test_api.py -v
```

---

## API Specifications (Milestone 1)

### `GET /api/health`
Liveness and limits check.

**Response `200 OK`:**
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

### Standard Error Envelope (All non-2xx responses)
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested API endpoint was not found.",
    "details": null
  }
}
```

---

## Design System Tokens (AcademiX Warm SaaS)

- **Canvas Background:** `#FDFBF7` with corner radial glows (`#FFF8ED`)
- **Cards & Surfaces:** Pure white floating cards with soft elevations (`shadow-card`, `shadow-float`)
- **Primary Accent:** Warm amber (`#F59E0B`, hover `#D97706`)
- **Typography:** Modern tight-tracked sans font stack (Inter / system UI)
- **Dark Mode Policy:** Strictly prohibited (no dark mode, terminal chrome, or grid patterns)

---

## Ephemeral Privacy & Threat Mitigations

- **T1 Decompression Bomb:** SOF dimensions inspected prior to decode; hard 50 MP and 10 MB caps.
- **T2 Path Traversal:** Fixed internal file names (`original.jpg`, `cleaned.jpg`), strict token regex `^[A-Za-z0-9_-]{43}$`.
- **T3 MIME Spoofing:** Strict magic byte validation (`FF D8 FF`), segment scanner validation, and Pillow decode verification.
- **T4 Log Sanitization:** Filter prevents logging tokens, GPS coordinates, camera models, filenames, and parser exceptions.
- **T9 Residual Data:** Background janitor sweeps expired sessions every 30s; download purges directory immediately on stream close.
