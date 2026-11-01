# JC-APEX Repository Structure

**Last Updated:** October 29, 2026
**Status:** Cleaned and Consolidated

---

## Directory Tree Overview

```
JC-APEX/
├── .git/                          # Git version control
├── .vercel/                       # Vercel deployment configuration
├── database/                      # Database schemas and migrations
│   └── master.sql                 # MASTER SQL FILE (consolidated schema)
├── firmware/                      # ESP32-S3 firmware source code
│   ├── receiver/                  # LoRa receiver firmware
│   │   └── receiver.ino
│   └── transmitter/               # LoRa transmitter firmware
│       └── transmitter.ino
├── gateway/                       # Python telemetry bridge and AI ORACLE
│   ├── ai_oracle.py              # AI ORACLE intelligence engine
│   ├── run_bridge.py             # Main telemetry bridge (with AI integration)
│   ├── sync_offline_data.py      # Offline data sync utility
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Environment variables (gitignored)
│   └── .env.example              # Environment template
├── sessions/                      # Telemetry session CSV backups
│   ├── session_SES_*.csv         # Historical session data
├── web/                           # React/Vite frontend application
│   ├── api/                      # Server-side API endpoints
│   │   └── export-pdf.js
│   ├── public/                   # Static assets
│   │   └── favicon.ico
│   ├── src/                      # Source code
│   │   ├── api/                  # API client utilities
│   │   │   └── base44Client.js
│   │   ├── components/           # React components
│   │   │   ├── command/          # Pit command panels
│   │   │   ├── common/           # Shared UI components
│   │   │   ├── driver/           # Driver HUD components
│   │   │   ├── landing/          # Landing page components
│   │   │   ├── oracle/           # AI Oracle components
│   │   │   ├── pit/              # Pit center components
│   │   │   ├── strategy/         # Strategy components
│   │   │   ├── telemetry/        # Telemetry visualization
│   │   │   └── ui/               # UI primitives (shadcn/ui)
│   │   │       └── sidebar/      # Sidebar components
│   │   ├── context/              # React contexts
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── telemetry/        # Telemetry-specific hooks
│   │   ├── lib/                  # Library utilities
│   │   ├── pages/                # Page components
│   │   │   ├── circuit-map/      # Circuit map sub-pages
│   │   │   └── pit-center/       # Pit center sub-pages
│   │   ├── services/             # Service layer
│   │   ├── styles/               # CSS styles
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   ├── .env                      # Environment variables (gitignored)
│   ├── .env.example              # Environment template
│   ├── components.json           # Shadcn UI configuration
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # HTML entry point
│   ├── jsconfig.json             # JavaScript configuration
│   ├── package.json              # Dependencies and scripts
│   ├── package-lock.json         # Dependency lock file
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── vercel.json               # Vercel deployment config
│   ├── vite.config.js            # Vite bundler configuration
│   ├── DESIGN_SYSTEM.md          # Design system documentation
│   └── NAVIGATION_FLOWS.md       # Navigation flow documentation
├── .env.example                  # Root environment template
├── .gitignore                    # Git ignore rules
├── JC-APEX_SYSTEM.md            # System documentation
└── SECURITY_REMEDIATION_SUMMARY.md  # Security fixes summary
```

---

## Consolidation Summary

### SQL Files Consolidated
**Before:**
- `database/JC-APEX_DATABASE.sql` (299 lines)
- `database/ai_recommendations.sql` (72 lines)

**After:**
- `database/master.sql` (314 lines) - Single consolidated file

**Changes:**
- Merged all tables, indexes, RLS policies, and seed data
- Added AI ORACLE table with full RLS policies
- Updated to version 3.0 with comprehensive documentation
- Maintained proper execution order (tables → relations → indexes → seed data)

### Session Data Organization
**Before:**
- CSV files scattered in root directory

**After:**
- All session CSV files moved to `sessions/` directory
- Proper separation of runtime data from source code

### Build Artifacts Removed
- Deleted `web/dist/` directory (build artifacts)
- These are regenerated on each build via `npm run build`

### Documentation Updated
- `SECURITY_REMEDIATION_SUMMARY.md` updated to reference `database/master.sql`
- All references to old SQL files replaced with consolidated file path

---

## File Count Summary

### SQL Files
- **Before:** 2 files
- **After:** 1 file (-50%)

### Root Directory
- **Before:** 8 CSV files scattered
- **After:** 0 CSV files in root (all in `sessions/`)

### Build Artifacts
- **Before:** `web/dist/` directory present
- **After:** Clean (recreated on build)

---

## Key Changes for Application Configuration

### No Code Changes Required
- The consolidation does not require any application code changes
- Supabase configuration remains the same
- Run the master.sql file in Supabase SQL Editor to apply schema

### Deployment Commands
```bash
# Apply database schema
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of database/master.sql
# 3. Run the script

# Build and deploy
cd web
npm install
npm run build
vercel --prod
```

---

## Verification Checklist

- [x] All SQL files consolidated into `database/master.sql`
- [x] Old SQL files deleted (`JC-APEX_DATABASE.sql`, `ai_recommendations.sql`)
- [x] Session CSV files moved to `sessions/` directory
- [x] Build artifacts (`web/dist/`) removed
- [x] Documentation updated to reference new file structure
- [x] No empty directories remaining
- [x] No temporary or backup files found
- [x] Repository structure is clean and organized

---

## Repository Statistics

- **Total Directories:** 33 (excluding .git and node_modules)
- **SQL Files:** 1 (consolidated)
- **Configuration Files:** 8
- **Documentation Files:** 3
- **Source Files:** 150+ (across firmware, gateway, and web)

---

## Notes

- `node_modules/` is excluded from tree view (standard practice)
- `.git/` is excluded from tree view (version control metadata)
- `sessions/` contains runtime data and should be gitignored
- All source code is properly organized by functional area
- Database schema is now single-source-of-truth in `master.sql`
