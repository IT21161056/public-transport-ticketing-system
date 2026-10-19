# UrbanTransit – Passenger Web App & Operations Console

The official web frontend for the **UrbanTransit** metropolitan transport ticketing network. Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 🚉 Overview & User Experiences

The frontend separates public transit interactions into three distinct user flows:

1. **Local Commuter Portal (`/dashboard`, `/qr`, `/top-up`, `/profile`):**
   - Passwordless phone login via simulated 6-digit SMS OTP.
   - Dedicated navigation sidebar (`CommuterSidebar.tsx`) with safe viewport flex scrolling (`min-h-0`).
   - Digital wallet balance with instant reload tiers (+500, +1000, +2500, +5000 Credits) and bonus incentives.
   - Persistent HMAC-SHA256 signed QR pass with high-contrast display and PNG download.
   - Filterable trip activity ledger (*All*, *Rides*, *Top-Ups*).

2. **Visitor Pass Wizard (`/guest-period`, `/checkout`, `/payment`, `/guest-qr`):**
   - Streamlined 4-step linear purchase wizard with **no sidebar**.
   - Zero account registration: anonymous device tracking via RFC4122 UUID.
   - Pre-paid passes: **1-Day (24h)**, **3-Day (72h)**, and **7-Day (168h)**.
   - Simulated card and Apple/Google Pay checkout with confetti celebration.
   - Live pass countdown clock and offline device screenshot guidance.

3. **Transit Authority Operations Console (`/admin/*`):**
   - Encapsulated within `AdminLayout.tsx` and `AdminSidebar.tsx`.
   - Real-time network telematics (active commuters, circulating float, fleet passes, journey taps, revenue).
   - User account auditing (credit balance adjustments with audit reason logging, account freeze/unfreeze).
   - Turnstile Gate Tap Simulator (`GateScannerModal.tsx`) for testing hardware clearance rules without physical turnstiles.

---

## 🔒 Physical Scanning Separation Policy

In alignment with real-world metropolitan transport systems:
- **Passengers** carry digital tickets and present their screens to station turnstiles.
- **Station Gates & Optical Scanners** are physical transit hardware.
- The passenger-facing website contains **no** gate scanner widgets or camera controls.
- Gate clearance simulation is strictly isolated to the **Transit Authority Admin Console**.

---

## 📁 Source Directory Map

```text
src/
├── api/                      # Axios clients with bearer token interceptors
│   ├── auth.ts               # Phone OTP dispatch & Admin login
│   ├── account.ts            # Commuter wallet balance, top-up & trip ledger
│   ├── token.ts              # QR token generation, guest pass checkout & gate validation
│   ├── admin.ts              # Operations telematics, user audits & balance adjustments
│   └── vehicle.ts            # Real-time transit fleet & station status
├── components/               # Design system & reusable widgets
│   ├── CommuterSidebar.tsx   # Commuter left navigation sidebar with min-h-0 flex scroll
│   ├── AdminSidebar.tsx      # High-density dark operations console sidebar
│   ├── Navbar.tsx            # Clean visitor & public landing header
│   ├── QRViewer.tsx          # High-contrast SVG QR with PNG download
│   ├── GateScannerModal.tsx  # Turnstile clearance validation simulator (Admin only)
│   └── ...
├── layouts/
│   ├── MainLayout.tsx        # Responsive layout wrapping Commuter & Visitor views
│   └── AdminLayout.tsx       # Isolated enterprise operations console layout
├── pages/
│   ├── Home.tsx              # Public visitor landing page
│   ├── Login.tsx             # SMS OTP commuter login
│   ├── Register.tsx          # Minimal commuter registration
│   ├── Dashboard.tsx         # Commuter transit hub
│   ├── LocalQrPage.tsx       # Dedicated persistent QR pass view
│   ├── TopUpCreditsPage.tsx  # Digital wallet top-up & payment tier selection
│   ├── ProfilePage.tsx       # Commuter profile & filterable journey ledger
│   ├── GuestPeriodPage.tsx   # Visitor duration selection (1, 3, 7 days)
│   ├── CheckoutPage.tsx      # Pass order review & network inclusions
│   ├── PaymentPage.tsx       # Mock payment gateway (Cards, Apple Pay, Google Pay)
│   ├── GuestQrPage.tsx       # Active visitor pass with live countdown clock
│   ├── AdminLogin.tsx        # Dedicated administrator authentication view
│   └── AdminDashboard.tsx    # Live operations control center & user auditing
├── routes.ts                 # Centralized type-safe route definitions
├── types.ts                  # Shared TypeScript contracts & domain DTOs
├── App.tsx                   # Master router tree, auth guards & layout bindings
└── main.tsx                  # Application root entry
```

---

## 🔐 Authentication & Session Storage

| Role | Route Tree | Storage Keys | Guard Behavior |
| :--- | :--- | :--- | :--- |
| **Commuter** | `/dashboard`, `/qr`, `/top-up`, `/profile` | `token`, `user` | Redirects to `/login` if unauthenticated |
| **Visitor** | `/guest-period`, `/checkout`, `/payment`, `/guest-qr` | `device_uuid`, `guest_pass` | Anonymous device UUID generated automatically |
| **Admin** | `/admin/*` | `admin_token`, `admin_user` | Strict role check (`role === 2`); redirects to `/admin/login` |

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
- Web Application: **`http://localhost:5173`**
- Admin Console: **`http://localhost:5173/admin/login`**

### 3. Build & Type-Check
```bash
# Type-check TypeScript files without emitting JS
npx tsc -b --noEmit

# Production bundle build
npm run build
```
