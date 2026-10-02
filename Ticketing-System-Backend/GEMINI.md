# Design Document: User Registration & Token Acquisition System

## 1. Project Overview
This system serves as the digital gateway for a Public Transport Network. It provides two distinct paths for travel: **Local Users** (account-based with a digital wallet) and **Guest Users** (account-less with time-bound passes).

### Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS + `qrcode.react`
- **Backend:** .NET 8/10 Web API + Entity Framework Core
- **Database:** PostgreSQL (Docker container `postgres`, database `ticketing_system`)
- **Authentication:** JWT (JSON Web Tokens) + Simulated OTP

---

## 2. Core Architectural Decisions

### 2.1 Zero-Friction Registration
To ensure high usability, the system uses a **Phone + OTP** model for local users and a **Device UUID** model for guests. No passwords are required.

### 2.2 Strategy-Based Fare Calculation
Following the UML design, the .NET backend implements the `IFareStrategy` interface. 
- **Distance-Based:** For Local Users (calculated at Tap-Out).
- **Flat-Rate/Pass-Based:** For Guests (pre-paid, fare is 0 during travel).

### 2.3 Hybrid QR Generation
- **Backend Role:** Generates a cryptographically signed string (e.g., HMAC-SHA256) containing `AccountID`, `Expiry`, and `Nonce`.
- **Frontend Role:** Uses `qrcode.react` to render the signed string into a scannable image.

---

## 3. User Flows

### 3.1 Local User (Account Holder)
1. **Login/Register:** User enters Name and Phone Number.
2. **Verification:** Backend generates a 6-digit OTP (stored in cache/DB with 2-min expiry).
3. **Auth:** User submits OTP. Backend validates and returns a JWT.
4. **Dashboard:**
    - **Wallet:** Displays `CurrentBalance`.
    - **Permanent Token:** Displays the digital QR.
    - **Top-Up:** Integration point for Payment Gateway to add credit.
    - **History:** List of previous journeys and fares (for expense claims).

### 3.2 Guest User (Visitor)
1. **Landing:** User selects "Visitor Access."
2. **Identification:** Frontend checks `localStorage` for `device_uuid`. If empty, it generates one.
3. **Pass Tier Selection:**
    - 1-Day (24h)
    - 3-Day (72h)
    - 7-Day (1 Week)
4. **Checkout:** User pays a fixed amount via the Payment Gateway.
5. **Token Generation:** Backend issues a `GuestPassToken` linked to the `device_uuid` with a hard expiry date.
6. **Token View:** Displays the QR code. User is advised to screenshot for backup.

---

## 4. Backend API Design (.NET)

### 4.1 Identity Controller
- `POST /api/auth/request-otp`: Receives phone number; sends OTP.
- `POST /api/auth/verify-otp`: Validates OTP; returns JWT.

### 4.2 Account Controller (Local)
- `GET /api/account/profile`: Returns balance and user details.
- `POST /api/account/topup`: Increases balance after successful payment.
- `GET /api/account/history`: Returns travel history JSON (convertible to CSV/PDF on frontend).

### 4.3 Token Controller
- `GET /api/token/generate`: 
    - For Locals: Returns signed string based on AccountID.
    - For Guests: Returns signed string based on DeviceID + Expiry.

---

## 5. Frontend Component Structure (React)

### 5.1 Main Components
- `LandingPage.jsx`: The split-choice entry (Local vs. Guest).
- `OTPModal.jsx`: Handles phone input and verification.
- `Dashboard.jsx`: Local user hub (Balance, QR, History).
- `GuestPurchase.jsx`: Tier selection and payment trigger.
- `QRViewer.jsx`: Reusable component using `qrcode.react`.

### 5.2 State Management (Context API)
- `AuthContext`: Stores JWT and `userType`.
- `WalletContext`: Manages the current balance and recent transactions.

---

## 6. Security & Data Integrity

| Feature | Implementation |
| :--- | :--- |
| **QR Security** | Backend signs the QR payload with a `SECRET_KEY`. Readers reject tokens with invalid signatures. |
| **Guest Retention** | Guest data is linked only to the `device_uuid`. If the user clears browser cache, the pass is lost unless they have a screenshot. |
| **Fare Evasion** | Every Tap-In creates a `Journey` record in the DB. Inspectors scan the QR to check for an "Active" journey. |
| **Privacy** | Local user records store only Name and Phone. Guest records are anonymous (UUID only). |

---

## 7. Implementation Roadmap

1. **Sprint 1 (Backend):** Set up .NET API, SQL Schema (Users, Journeys, Tokens), and JWT Auth.
2. **Sprint 2 (Frontend):** Build React Landing Page and OTP Flow.
3. **Sprint 3 (Core Logic):** Implement QR rendering and the "Guest UUID" logic.
4. **Sprint 4 (Management):** Build the Travel History list and the "Export to PDF" feature.
