<div align="center">

# 🅿️ SmartPark

### Smart Parking Management System — IoT (Arduino + ESP8266)

**Système de gestion de parking en temps réel : surveillance des places, réservations et tableau de bord analytique.**

[![IoT](https://img.shields.io/badge/IoT-Arduino%20%2B%20ESP8266-00979d?style=flat-square&logo=arduino)](https://www.arduino.cc)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![GitHub](https://img.shields.io/badge/GitHub-Am--Oussema-181717?style=flat-square&logo=github)](https://github.com/Am-Oussema)

</div>

---

## 📖 Overview

**SmartPark** is a real-time parking management system built on an end-to-end IoT architecture. It addresses three core needs:

| Pillar | Description |
|--------|-------------|
| 🔍 **Surveillance des places** | Ultrasonic sensors (HC-SR04) on an Arduino Uno detect vehicle presence per spot; an ESP8266 (NodeMCU) streams status updates to the cloud every ~2 s |
| 📅 **Réservations** | Users reserve available spots through a secured web app — with phone OTP verification, anti-abuse rules, and live countdowns |
| 📊 **Tableau de bord analytique** | A full analytics dashboard displays hourly occupancy charts, 7-day trends, KPIs, dynamic pricing, and admin controls |

> **Current status:** The web dashboard, authentication system, reservation engine, and analytics layer are **fully operational**. The physical IoT hardware layer (Arduino + ESP8266 firmware) is **in progress**.

---

## ✨ Features

### 🗺️ Live Parking Map
- Visual 2×2 grid showing each spot's real-time status: **Free** / **Reserved** / **Occupied**
- Live countdown timer on reserved spots; automatic release on expiry
- Supabase Realtime subscription — every connected user sees updates **instantly** (no polling)

### 📊 KPI Dashboard
| KPI | Description |
|-----|-------------|
| Free spots | Count of currently available spots |
| Occupied spots | Sensor-detected or manually confirmed occupancy |
| Reserved spots | Spots locked by pending reservations |
| Occupancy rate | `(occupied + reserved) / total × 100` — live % |

### 📈 Analytics
- **Hourly occupancy chart** — bar chart of real parking occupancy % for every hour today (clipped time-window algorithm, carry-over logic for overnight sessions)
- **7-day trend line** — daily average occupancy over the past week
- Both charts powered by `spot_events` table and Recharts; auto-refresh every 5 minutes

### 📅 Reservation System
- Reserve any free spot with a **15-minute grace window** to arrive
- Requires a **verified phone number** (OTP flow) before booking
- Anti-abuse rules enforced by a Deno Edge Function:
  - ✅ Max **3 reservations / day** per user
  - ✅ **40-minute same-spot cooldown** after each use
  - ✅ **20-minute global cooldown** between different spots
  - ✅ Ban check (temporary or permanent)
  - ✅ Atomic spot claim — race conditions prevented at DB level (unique index on `spot_number WHERE status IN ('pending','active')`)
- Reservation cancellation immediately frees the spot (DB trigger)
- Full reservation history with status labels: `pending / active / expired / cancelled / completed` + no-show flag

### 🔔 Smart Alerts
- **Toast notifications** when occupancy crosses the configurable alert threshold (default 80%)
- **Full parking alert** when occupancy hits 100%
- Alert-reset logic prevents duplicate toasts

### 💸 Dynamic Pricing (Surge)
- Configurable **base rate** (TND/h)
- **Surge multiplier** auto-activated above a configurable occupancy threshold (default ×1.2 above 70%)
- All parameters editable live from the Admin panel — persisted in the `settings` table

### 🔐 Authentication & Security
| Feature | Implementation |
|---------|---------------|
| Sign up / Login | Supabase Auth (email + password) |
| Forgot / Reset password | Supabase magic-link reset flow |
| Sessions | JWT-based, validated server-side with `auth.getUser()` |
| Deleted/expired accounts | Detected and signed out on next load |
| Phone verification | In-app OTP stored in `verification_codes`; uniqueness guaranteed at DB level |

### 👮 Role-Based Access Control
- `user` / `admin` roles stored in a **dedicated `user_roles` table** (not on `profiles`) to prevent privilege escalation
- `has_role()` helper is `SECURITY DEFINER` — avoids RLS recursion
- `AdminRoute` guard component client-side; RLS policies enforce the same rules server-side
- Admin capabilities: manage pricing settings, view/search all users, ban/unban with selectable duration (1d, 7d, 30d, permanent), trust score display

### 🚗 Vehicle Management
- Users can register **up to 2 vehicles** (plate + optional label)
- Plate uniqueness enforced globally at DB level
- Reservation is linked to a specific vehicle plate — tracked in history

### 🌗 Theme Support
- Light / Dark / System themes via `next-themes`
- CSS custom properties — zero flash on load

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHYSICAL LAYER (IoT)                                               │
│                                                                     │
│  [HC-SR04 ×4] ──→ [Arduino Uno] ──→ [ESP8266 NodeMCU]             │
│   Ultrasonic        Reads distances    WiFi → POST JSON             │
│   sensors           (< 20 cm = car)    every ~2 s                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  HTTP POST
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND (Supabase)                                                 │
│                                                                     │
│  Edge Function: POST /functions/v1/reserve                          │
│  ├── Auth validation (JWT)                                          │
│  ├── Anti-abuse checks (phone, ban, daily cap, cooldowns)           │
│  ├── Atomic spot claim (service_role bypasses RLS)                  │
│  └── Cooldown management (global 20 min + spot 40 min)             │
│                                                                     │
│  PostgreSQL Tables:                                                 │
│  ├── auth.users          ← Supabase managed                         │
│  ├── profiles            ← name, phone, trust_score, ban            │
│  ├── user_roles          ← admin | user (separate table)            │
│  ├── parking_spots       ← live status per spot + expires_at        │
│  ├── reservations        ← full reservation lifecycle               │
│  ├── spot_events         ← immutable log for analytics              │
│  ├── vehicles            ← up to 2 per user, globally unique plate  │
│  ├── verification_codes  ← OTP for phone verification               │
│  ├── settings            ← pricing & alert config (singleton row)   │
│  └── reservation_cooldowns ← per-user anti-abuse cooldowns          │
│                                                                     │
│  Realtime: parking_spots table broadcast → all clients              │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  WebSocket (Realtime)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                            │
│                                                                     │
│  Landing page → Auth pages → Protected Dashboard                    │
│  useParkingData (Realtime sub) → ParkingMap / KpiCards              │
│  AnalyticsCharts ← spot_events queries                              │
│  Admin panel ← settings + profiles + user_roles                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧱 Tech Stack

### Frontend
| Technology | Version | Role |
|-----------|---------|------|
| React | 18 | UI framework |
| TypeScript | 5 (strict) | Type safety |
| Vite + SWC | 8 | Build tool & HMR |
| Tailwind CSS | 3 | Utility-first styling |
| shadcn/ui | latest | Accessible component primitives (Radix UI) |
| TanStack Query | 5 | Server-state management |
| React Router DOM | 6 | Client-side routing |
| React Hook Form + Zod | 7 / 3 | Forms & schema validation |
| Recharts | 2 | Analytics charts |
| Sonner | 1 | Toast notifications |
| next-themes | 0.3 | Dark/light/system themes |
| Lucide React | 0.462 | Icon library |
| date-fns | 3 | Date formatting & locale |

### Backend (Supabase)
| Technology | Role |
|-----------|------|
| PostgreSQL | Primary database (managed) |
| Supabase Auth | Email/password + JWT sessions |
| Row Level Security | Every table protected; `SECURITY DEFINER` functions for safe role checks |
| Supabase Realtime | Live spot status broadcast via PostgreSQL logical replication |
| Deno Edge Functions | Reservation logic with service-role atomic writes |
| Supabase Migrations | 8 versioned SQL migration files |

### IoT (Target Hardware)
| Component | Role |
|-----------|------|
| Arduino Uno | Reads 4× HC-SR04 sensors via `pulseIn()` |
| HC-SR04 Ultrasonic Sensors (×4) | Detect vehicle presence (< 20 cm threshold) |
| ESP8266 NodeMCU | WiFi connectivity; POST JSON to Supabase Edge Function every ~2 s |

### Tooling
| Tool | Role |
|------|------|
| ESLint 9 (flat config) | Linting |
| Vitest + Testing Library + JSDOM | Unit & integration tests |
| Bun / npm | Package manager |

---

## 📁 Project Structure

```
smartpark-ofha/
├── public/                          # Static assets (videos, images)
│   ├── smart-park.mp4               # Hero background video
│   └── secure_sp.mp4                # Feature section video
│
├── src/
│   ├── components/
│   │   ├── dashboard/               # Business-logic widgets
│   │   │   ├── AlertBanner.tsx      # High-occupancy warning banner
│   │   │   ├── AnalyticsCharts.tsx  # Hourly + 7-day occupancy charts
│   │   │   ├── EntryExitCounter.tsx # Entry/exit simulation counters
│   │   │   ├── KpiCards.tsx         # Free / Occupied / Reserved / Rate cards
│   │   │   ├── ParkingMap.tsx       # Interactive 4-spot live map
│   │   │   └── PricingPanel.tsx     # Dynamic pricing display
│   │   ├── ui/                      # shadcn/ui primitives (Radix)
│   │   ├── AdminRoute.tsx           # Admin-only route guard
│   │   ├── AppSidebar.tsx           # Dashboard navigation sidebar
│   │   ├── NavLink.tsx              # Sidebar link with active state
│   │   ├── ProtectedRoute.tsx       # Auth-required route guard
│   │   ├── ThemeProvider.tsx        # next-themes wrapper
│   │   └── ThemeToggle.tsx          # Light/dark/system toggle button
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx              # Supabase Auth context (getUser server-side)
│   │   ├── useParkingData.ts        # Live spots + KPIs + pricing + alerts
│   │   ├── useProfile.ts            # User profile + phone_verified state
│   │   └── useUserRole.tsx          # Admin role check from user_roles table
│   │
│   ├── pages/
│   │   ├── Landing.tsx              # Public landing page (hero, features, IoT stack)
│   │   ├── Login.tsx                # Sign-in form
│   │   ├── Register.tsx             # Sign-up form (name, phone, email, password)
│   │   ├── ForgotPassword.tsx       # Password reset request
│   │   ├── ResetPassword.tsx        # New password form (from email link)
│   │   ├── NotFound.tsx             # 404 page
│   │   └── dashboard/
│   │       ├── Overview.tsx         # Main dashboard: map + KPIs + charts + pricing
│   │       ├── Reservations.tsx     # Active reservations with live countdown
│   │       ├── History.tsx          # Last 50 reservations with status & billing
│   │       ├── Account.tsx          # Profile, phone OTP verification, vehicles, password
│   │       └── Admin.tsx            # Pricing settings + user management (ban/unban)
│   │
│   ├── layouts/
│   │   └── DashboardLayout.tsx      # Sidebar + main content shell
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts            # Supabase JS client singleton
│   │   └── utils.ts                 # cn() and misc helpers
│   │
│   ├── test/
│   │   └── setup.ts                 # Vitest + Testing Library global setup
│   │
│   ├── App.tsx                      # Route tree + all providers
│   ├── main.tsx                     # React DOM entry point
│   └── index.css                    # Tailwind directives + CSS design tokens
│
├── supabase/
│   ├── config.toml                  # Supabase CLI project config
│   ├── functions/
│   │   └── reserve/
│   │       └── index.ts             # Deno edge function — reservation logic
│   └── migrations/                  # Versioned SQL schema (8 files)
│       ├── 20260419_init_smart_parking.sql      # Roles, profiles, reservations, triggers
│       ├── 20260420_*.sql                        # RLS policy fix
│       ├── 20260425_add_settings_table.sql       # Pricing settings singleton
│       ├── 20260425_identity_layer.sql           # phone_verified, trust_score, vehicles
│       ├── 20260425_verification_codes.sql       # OTP verification table
│       ├── 20260428_reservation_system.sql       # parking_spots, extended reservations, Realtime
│       ├── 20260502_update_reservation_trigger.sql
│       └── 20260503_spot_events.sql              # Immutable event log for analytics
│
├── .env.example                     # Environment variable template
├── components.json                  # shadcn/ui configuration
├── tailwind.config.ts               # Tailwind theme + custom tokens
├── vite.config.ts                   # Vite build configuration
├── vitest.config.ts                 # Vitest test configuration
└── tsconfig.json                    # TypeScript compiler options
```

---

## 🗄️ Database Schema

```
auth.users (Supabase managed)
  │
  ├─→ profiles (1:1)
  │     id, email, full_name, phone, phone_verified,
  │     trust_score, daily_res_count, ban_until, ...
  │
  ├─→ user_roles (1:N)
  │     user_id, role: enum('admin' | 'user')
  │
  ├─→ vehicles (1:N, max 2)
  │     user_id, plate (globally unique), label
  │
  ├─→ reservations (1:N)
  │     user_id, spot_number, vehicle_id, plate,
  │     status, expires_at, grace_minutes,
  │     duration_min, amount_due, no_show, ...
  │
  └─→ verification_codes (1:N)
        user_id, phone, code, expires_at, used

parking_spots (4 rows, IoT-driven)
  id, status: free|pending|occupied|flagged,
  current_plate, expires_at, last_updated
  → Realtime enabled

spot_events (append-only log)
  spot_id, event: occupied|free, occurred_at
  → Powers all analytics charts

settings (singleton — id = 1)
  base_price, surge_threshold,
  surge_multiplier, alert_threshold

reservation_cooldowns
  user_id, spot_id, blocked_until, reason
  → spot_id = -1 means global cooldown
```

### Key Security Policies (RLS)
- Every table has **Row Level Security enabled**
- Users can only read/write **their own rows** (`auth.uid() = user_id`)
- Admins access all rows via `has_role(auth.uid(), 'admin')` — a `SECURITY DEFINER` function that avoids RLS recursion
- Roles live in `user_roles`, **not** on `profiles` — eliminates self-privilege-escalation vectors
- Spot updates and event inserts are **service_role only** (no RLS policy = Edge Function required)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js ≥ 18** or **[Bun](https://bun.sh) ≥ 1.0**
- A [Supabase](https://supabase.com) project (or use the pre-configured one in `.env`)

### 1. Clone & Install

```bash
git clone <repo-url> smartpark-ofha
cd smartpark-ofha

# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL="https://<your-project-id>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-public-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-id>"
```

> **Security note:** The `anon` key is intentionally public — Supabase's security model relies on RLS policies enforced at the database level. **Never** expose the `service_role` key client-side.

### 3. Apply Database Migrations

```bash
# Link to your Supabase project
npx supabase link --project-ref <your-project-id>

# Push all migrations
npx supabase db push
```

All migrations are in `supabase/migrations/` and are idempotent.

### 4. Deploy the Edge Function

```bash
npx supabase functions deploy reserve
```

### 5. Run in Development

```bash
bun run dev
# → http://localhost:5173
```

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase `anon` public key (safe to expose) |
| `VITE_SUPABASE_PROJECT_ID` | Project reference ID |

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with HMR (Vite) |
| `bun run build` | Production build → `dist/` |
| `bun run build:dev` | Development build (sourcemaps included) |
| `bun run preview` | Serve the production build locally |
| `bun run lint` | Lint with ESLint 9 (flat config) |
| `bun run test` | Run unit tests once (Vitest) |
| `bun run test:watch` | Run tests in watch mode |

*(Replace `bun` with `npm run` if using npm)*

---

## 🔌 IoT Integration (ESP8266 → Supabase)

The system is designed to ingest real sensor data from a 4-spot parking lot.

### Hardware Setup
```
[Spot 1] HC-SR04 TRIG → Arduino D2  ECHO → Arduino D3
[Spot 2] HC-SR04 TRIG → Arduino D4  ECHO → Arduino D5
[Spot 3] HC-SR04 TRIG → Arduino D6  ECHO → Arduino D7
[Spot 4] HC-SR04 TRIG → Arduino D8  ECHO → Arduino D9
Arduino TX (Serial) → ESP8266 RX
Arduino RX (Serial) → ESP8266 TX
```

### Data Flow
1. **Arduino** reads distance every ~2 s via `pulseIn()`. Spot = **occupied** if distance < 20 cm.
2. **ESP8266** receives the JSON array over Serial and POSTs it to a Supabase Edge Function:

```json
POST /functions/v1/parking-state
{
  "spots": [
    { "id": 1, "status": "free" },
    { "id": 2, "status": "occupied" },
    { "id": 3, "status": "free" },
    { "id": 4, "status": "occupied" }
  ]
}
```

3. **Edge Function** updates `parking_spots` using `service_role` — bypasses RLS.
4. **Supabase Realtime** broadcasts the change to all connected dashboard clients instantly.
5. **Frontend** (`useParkingData` hook) receives the Postgres change event and updates the UI.

> **Demo mode:** Until hardware is connected, the dashboard is fully functional using Realtime subscriptions and the simulate-entry / simulate-exit admin buttons.

---

## 👤 Granting Admin Access

After a user registers, run this in the Supabase SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your@email.com'
ON CONFLICT DO NOTHING;
```

---

## 🧪 Testing

```bash
bun run test          # Single run
bun run test:watch    # Watch mode
```

**Stack:** Vitest · @testing-library/react · jsdom  
**Setup file:** `src/test/setup.ts`

---

## 🗺️ Roadmap

- [x] Live parking map with Supabase Realtime
- [x] Full authentication system (signup, login, reset)
- [x] Role-based access control (admin / user) with RLS
- [x] Reservation system with anti-abuse edge function
- [x] Phone OTP verification flow
- [x] Vehicle management (up to 2 per account)
- [x] Dynamic surge pricing engine
- [x] Analytics charts (hourly + 7-day)
- [x] Admin panel (pricing settings + user management + banning)
- [x] Reservation history with billing fields
- [ ] ESP8266 Arduino firmware (sensor → cloud)
- [ ] Edge function for IoT sensor ingestion (`POST /parking-state`)
- [ ] SMS provider integration for real OTP delivery
- [ ] `pg_cron` job for automatic reservation expiry
- [ ] Expanded unit & integration test coverage
- [ ] Internationalization (FR / EN / AR)
- [ ] PWA support + push notifications

---

## 👤 Author

**Oussema Amri** 

[![GitHub](https://img.shields.io/badge/GitHub-Am--Oussema-181717?style=flat-square&logo=github)](https://github.com/Am-Oussema)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Oussema%20Amri-0077b5?style=flat-square&logo=linkedin)](https://linkedin.com/in/oussama-amri-94b34326a)

> *SmartPark is an IoT project demonstrating end-to-end system design — from embedded hardware (Arduino Uno + HC-SR04 sensors + ESP8266 WiFi) through a cloud backend (Supabase / PostgreSQL + Realtime) to a modern full-stack web application (React + TypeScript + Vite) — covering real-time spot surveillance, a complete reservation lifecycle, and a business analytics dashboard.*

---

## 📜 License

© 2026 SmartPark — Oussema Amri. All rights reserved.
