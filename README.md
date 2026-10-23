# UrbanTransit – Contactless Metropolitan Transport Ticketing System

A high-performance, privacy-centric public transit ticketing and turnstile gate management platform built with an ASP.NET Core 10 Web API, PostgreSQL, and a React + Vite TypeScript frontend.

---

## 🚉 System Overview

UrbanTransit provides modern, contactless access across metropolitan rail, rapid bus, and tram networks through two distinct passenger models and an enterprise administration suite:

1. **Local Commuters (Account-Based):**
   - Passwordless phone authentication verified via 6-digit SMS OTP.
   - Persistent, reusable HMAC-SHA256 signed QR pass credential.
   - Stored-value digital wallet with instant credit top-ups (+500, +1000, +2500, +5000 Credits) and bonus tiers.
   - Per-ride distance fare deduction (standard 150.00 Credits per tap) with low-balance alerts.
   - Detailed personal journey logs with activity filters (*All*, *Rides*, *Top-Ups*).
   - Dedicated commuter desktop sidebar and collapsible mobile drawer.

2. **Visitors & Tourists (Pass-Based):**
   - Instant guest access without account creation or password management.
   - Anonymous device tracking via RFC4122 UUID stored in browser storage.
   - Pre-paid time-bound unlimited travel passes: **1-Day (24h)**, **3-Day (72h)**, and **7-Day (168h)**.
   - Multi-channel checkout (*Credit / Debit Card* and *Apple Pay / Google Pay*).
   - Active pass view featuring live countdown timer and device screenshot advisories.

3. **Transit Authority Operations Console (`/admin`):**
   - Completely isolated administrative portal and JWT role-based router tree.
   - Real-time Operations Command Center: network commuters, circulating credit float, active guest fleet, gate tap volume, and fare revenue.
   - User account management: credit balance audits, manual credit adjustments with reason logging, and account status toggles (*Active* / *Suspended*).
   - Live turnstile journey stream and guest passes fleet monitoring.
   - Isolated Turnstile Gate Tap Simulator for station hardware validation.

---

## 🔒 QR Scanning Separation Policy

In alignment with real-world public transit standards:
- **Passengers (Commuters & Visitors)** use the web application to purchase passes, manage wallet balances, and present their cryptographic QR credentials.
- **Physical Turnstiles & Optical Scanners** operate as automated station infrastructure.
- The passenger-facing website contains **no** gate scanner widgets or simulation controls.
- Turnstile gate clearance simulation is strictly isolated to the **Transit Authority Admin Console** for inspector and operator testing.

---

## 🏗️ Monorepo Architecture

```text
Ticketing-System/
├── Ticketing-System-Backend/          # ASP.NET Core 10 Web API
│   ├── Controllers/                  # HTTP Endpoints
│   │   ├── AccountController.cs      # Commuter profile, balance, top-up & transactions
│   │   ├── AdminController.cs        # Role-authorized operations & user audits
│   │   ├── AuthController.cs         # Phone SMS OTP & Admin JWT credentials
│   │   ├── TokenController.cs        # Cryptographic tokens, guest passes & gate taps
│   │   └── VehicleController.cs      # Real-time transit fleet & station status
│   ├── Services/                     # Business logic & IFareStrategy implementations
│   │   ├── FareCalculationService.cs # Strategy-based dynamic fare engine
│   │   ├── TokenValidationService.cs # HMAC-SHA256 signature verification
│   │   └── OtpService.cs             # In-memory cached OTP dispatch & verification
│   ├── Repositories/                 # EF Core repository implementations
│   ├── Models/                       # PostgreSQL entity definitions (User, Journey, etc.)
│   ├── Data/                         # AppDbContext & entity configurations
│   ├── Extensions/                   # Modular service & middleware extensions
│   └── Program.cs                    # Application pipeline bootstrap
│
├── Ticketing-System-Frontend/         # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── api/                      # Axios API clients (Auth, Admin, Token, Vehicle)
│   │   ├── components/               # Design system components
│   │   │   ├── CommuterSidebar.tsx   # Commuter left navigation sidebar
│   │   │   ├── AdminSidebar.tsx      # Operations command sidebar
│   │   │   ├── Navbar.tsx            # Clean visitor public header
│   │   │   ├── QRViewer.tsx          # High-contrast SVG QR with PNG download
│   │   │   └── GateScannerModal.tsx  # Station turnstile scanner simulator (Admin)
│   │   ├── layouts/                  # MainLayout (Commuter/Guest) & AdminLayout
│   │   ├── pages/                    # Application route views
│   │   │   ├── Home.tsx              # Public visitor landing page
│   │   │   ├── Login.tsx             # SMS OTP commuter login
│   │   │   ├── Register.tsx          # Minimal commuter registration
│   │   │   ├── Dashboard.tsx         # Commuter transit hub
│   │   │   ├── LocalQrPage.tsx       # Persistent commuter QR pass
│   │   │   ├── TopUpCreditsPage.tsx  # Wallet reload & payment
│   │   │   ├── ProfilePage.tsx       # Commuter profile & filtered ride logs
│   │   │   ├── GuestPeriodPage.tsx   # Visitor duration selection
│   │   │   ├── CheckoutPage.tsx      # Order review & network inclusions
│   │   │   ├── PaymentPage.tsx       # Secure card & digital wallet payment
│   │   │   ├── GuestQrPage.tsx       # Active visitor pass with live countdown
│   │   │   ├── AdminLogin.tsx        # Operations administrator login
│   │   │   └── AdminDashboard.tsx    # Comprehensive operations command center
│   │   ├── routes.ts                 # Centralized type-safe route definitions
│   │   ├── types.ts                  # Shared domain contracts & DTOs
│   │   └── App.tsx                   # Master router tree & auth guards
│   └── package.json
│
├── docker-compose.yml                # PostgreSQL container specification
├── package.json                      # Monorepo task orchestration scripts
├── Ticketing-System.sln              # Visual Studio solution file
└── GEMINI.md                         # Authoritative architecture and design decisions
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **.NET 8 or 10 SDK** installed (`dotnet --version`)
- **Node.js 18+ & npm** installed (`node --version`)
- **Docker & Docker Compose** (for PostgreSQL database)

---

### 2. Start PostgreSQL Database
Run the pre-configured PostgreSQL container in the background:
```bash
docker compose up -d
```
> Database connection string configured in `Ticketing-System-Backend/appsettings.json`:  
> `Host=localhost;Port=5432;Database=ticketing_system;Username=postgres;Password=admin123`

---

### 3. Run Backend API (.NET)
```bash
# From workspace root:
npm run dev:backend

# Or directly:
cd Ticketing-System-Backend
dotnet run
```
- API Base URL: **`http://localhost:5179`**
- OpenAPI Schema: **`http://localhost:5179/openapi/v1.json`**

---

### 4. Run Frontend (React + Vite)
```bash
# From workspace root:
npm run dev:frontend

# Or directly:
cd Ticketing-System-Frontend
npm install
npm run dev
```
- Passenger Web Application: **`http://localhost:5173`**
- Admin Operations Portal: **`http://localhost:5173/admin/login`**

---

## 🛠️ Monorepo Root Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev:frontend` | Starts Vite frontend dev server at port 5173 |
| `npm run dev:backend` | Starts ASP.NET Core Web API at port 5179 |
| `npm run build` | Compiles both Vite frontend and .NET backend solution |
| `npm run build:frontend` | Type-checks (`tsc -b`) and creates production web bundle |
| `npm run build:backend` | Compiles the .NET solution (`Ticketing-System.sln`) |
| `npm run docker:up` | Boots the PostgreSQL container via Docker Compose |
| `npm run docker:down` | Gracefully shuts down the PostgreSQL container |

---

## 🗄️ Database Migrations Workflow (EF Core)

UrbanTransit uses standard Entity Framework Core migrations with automatic application on startup.

### How Automatic Migrations Work
When the backend application starts up (`dotnet run`), [DbInitializer.cs](file:///c:/My%20Folder/projects/Ticketing-System/Ticketing-System-Backend/Data/DbInitializer.cs) executes:
```csharp
await context.Database.MigrateAsync();
```
This automatically compares your migration files against PostgreSQL's `__EFMigrationsHistory` table and applies any pending migrations without requiring manual database commands.

### Steps When Changing Schema / Entities
Whenever you modify an entity in `Ticketing-System-Backend/Models/Entities/` or update configurations in `AppDbContext.cs`, follow this 3-step workflow:

1. **Update Entity or DbContext**:
   Modify the C# entity properties or entity configurations.

2. **Generate Migration**:
   Ensure the backend is stopped, then create a new migration:
   ```bash
   # From repository root:
   dotnet ef migrations add <DescriptiveMigrationName> --project Ticketing-System-Backend

   # Or from inside Ticketing-System-Backend/:
   dotnet ef migrations add <DescriptiveMigrationName>
   ```
   > **Example:** `dotnet ef migrations add AddNfcCardUidToUser --project Ticketing-System-Backend`

3. **Run the Application**:
   ```bash
   dotnet run --project Ticketing-System-Backend
   ```
   The backend will automatically detect the new migration and apply it to PostgreSQL on startup.

### Quick Migration Commands
| Goal | Command |
| :--- | :--- |
| **List migrations** | `dotnet ef migrations list --project Ticketing-System-Backend` |
| **Apply migrations manually** | `dotnet ef database update --project Ticketing-System-Backend` |
| **Remove last unapplied migration** | `dotnet ef migrations remove --project Ticketing-System-Backend` |

---

## 🔑 Default Credentials & Test Data

### Administrator Access
- **URL:** `http://localhost:5173/admin/login`
- **Username:** `admin`
- **Password:** `Admin@123`
- **Role:** `Admin` (Role value `2`)

### Commuter Registration & Login
- **URL:** `http://localhost:5173/login` or `http://localhost:5173/register`
- **Country Calling Codes Supported:** LK (`+94`), US (`+1`), UK (`+44`), AU (`+61`), SG (`+65`), IN (`+91`), AE (`+971`).
- **SMS OTP Verification:** On submission, a simulated 6-digit verification code is dispatched and previewed via the in-app notification toast.

### Pre-Configured Turnstile Standard Fare
- **Fare per Tap:** `150.00 Credits` (~$2.50)
- **Minimum Required Balance:** `150.00 Credits` (taps rejected with `INSUFFICIENT_FUNDS` if balance is below threshold).

---

## 📄 License & Attribution
Designed for metropolitan transit authorities adhering to strict minimal-data collection and zero-evasion cryptographic token verification. Built with ASP.NET Core and React.
