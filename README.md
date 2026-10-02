# UrbanTransit – Contactless Transport QR Ticketing System

A full-stack, contactless public transport ticketing and access management system built with a modular monorepo architecture.

---

## 🏗️ Monorepo Architecture

```text
Ticketing-System/
├── Ticketing-System-Backend/     # ASP.NET Core 10 Web API
│   ├── Controllers/             # HTTP endpoints (Auth, Account, Token, Vehicle)
│   ├── Services/                # Domain business logic & IFareStrategy implementations
│   ├── Repositories/            # EF Core data access layer
│   ├── Models/                  # PostgreSQL entity definitions
│   ├── Data/                    # AppDbContext & EF configurations
│   ├── Extensions/              # Modular Service & Middleware extensions
│   └── Program.cs               # Decoupled bootstrap pipeline
│
├── Ticketing-System-Frontend/    # React (Vite) + Tailwind CSS v4
│   ├── src/
│   │   ├── api/                 # Axios clients (Auth, Tokens, Vehicles)
│   │   ├── components/          # Reusable UI (Navbar, QRViewer, Button, Input)
│   │   ├── hooks/               # useAuth, useTheme (Dark/Light toggle)
│   │   ├── pages/               # Dashboard, Local QR, Guest Passes, Gate Scanner
│   │   └── types/               # TypeScript domain interfaces
│   └── package.json
│
├── docker-compose.yml           # PostgreSQL container setup
├── package.json                 # Monorepo task orchestration scripts
├── Ticketing-System.sln         # Root .NET Solution (Visual Studio / Rider)
└── .gitignore                   # Unified monorepo ignore rules (.NET + Node)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **.NET 8 or 10 SDK**
- **Node.js 18+ & npm**
- **Docker & Docker Compose** (for PostgreSQL)

---

### 2. Start PostgreSQL Database
```bash
# Start the PostgreSQL Docker container
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
Backend API will be listening on: **`http://localhost:5179`**
OpenAPI documentation: **`http://localhost:5179/openapi/v1.json`**

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
Frontend web application will be accessible at: **`http://localhost:5173`**

---

## 📦 Monorepo Root Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev:frontend` | Starts Vite frontend dev server |
| `npm run dev:backend` | Starts ASP.NET Core API |
| `npm run build` | Builds both frontend bundle and .NET backend solution |
| `npm run build:frontend`| Compiles TypeScript & bundles Vite production assets |
| `npm run build:backend` | Builds the .NET solution (`Ticketing-System.sln`) |
| `npm run docker:up` | Starts the PostgreSQL container in background |
| `npm run docker:down` | Stops the PostgreSQL container |

---

