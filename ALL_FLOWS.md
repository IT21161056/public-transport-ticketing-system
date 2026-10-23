
Here is the complete, non-code breakdown of all **4 Flows** in your group’s redesigned system. You can use this directly to align with your 3 teammates, explain the architecture in your report, or present your walkthrough during the viva.

---

### **Flow 1: Token Acquisition — Local Commuters vs. Visitors (Your Flow)**

**Core Purpose:** How a new user (either a local citizen or a foreign tourist) gets a valid travel token to use the public bus network.

* **What was wrong in the old report:**
  * Completely skipped how a local passenger registers and loads their required initial credit.
  * Violated the case study rule that visitors *"won't have any personal accounts"* by forcing visitors to inherit `name` and `email` and giving them account top-up methods.
  * Had no way for an account-less visitor to keep/re-open their QR code or for the system to validate it later.
  * Missing all UI screens (Section 8.4 was accidentally left out).
* **How the new flow works step-by-step:**
  1. **Mode Selection:** The user opens the portal and chooses either **Local Commuter Pass** or **Visitor Express Pass**.
  2. **Path A — Local Commuter (Fuel-Pass Style):**
     * Enters only **Name** and **Mobile Number** (no unnecessary personal/social profile data).
     * Verifies the mobile number using a **6-digit SMS OTP**.
     * Selects an **Initial Credit** amount (e.g., minimum LKR 500) and token medium (Digital QR or Smartcard).
     * Pays via the Payment Gateway $\rightarrow$ System creates their permanent `Account`, loads the initial balance, and generates their active `AccountLinkedToken`.
  3. **Path B — Visitor / Tourist (No Personal Account):**
     * Enters **zero personal details**.
     * Selects a fixed duration pass: **1-Day Pass**, **3-Day Pass**, or **7-Day Pass**.
     * Pays upfront via the Payment Gateway $\rightarrow$ System generates an anonymous `VisitorToken` bound directly to their smartphone’s **Device ID (`boundDeviceId`)**.
  4. **Storage & Auto-Recovery:** Both token types are saved in the central `TokenRepository`. Whenever a visitor reopens the portal on their phone, the system checks their `Device ID` and automatically displays their active QR code and remaining validity time without needing a login.

---

### **Flow 2: Ticket Inspector Validation & Transport Manager Reports**

**Core Purpose:** How ticket inspectors verify passengers inside a bus, and how public transport managers use inspection, journey, and fare data to make operational decisions.

* **What was wrong in the old report:**
  * The sequence diagram (7.4) was drawn upside down—the system validated the token *before* the inspector even scanned it.
  * `TicketInspection` didn't record the **Route** or **Bus ID**, making it impossible for managers to know *where* fare evasion was happening.
  * The **Transport Manager** had zero sequence diagrams and zero UI screens.
* **How the new flow works step-by-step:**
  1. **Scanning on the Bus (Inspector Handheld):** The Ticket Inspector selects their current **Route** and **Bus ID** on their handheld reader and scans a passenger's token (Smartcard or QR).
  2. **Two-Step Verification:**
     * **Check 1 (Token Status):** Queries the `TokenRepository` (from Flow 1) to check if the token exists, is `ACTIVE`, and (if it’s a Visitor Pass) is **not expired**.
     * **Check 2 (Active Journey):** Checks if this token has an active **`TAP-IN` record** on the current bus (`status = IN_PROGRESS`).
  3. **Logging the Inspection Outcome:**
     * **If Valid:** Reader shows a green **VALID** screen with the boarding stop and time.
     * **If Invalid (No Tap-In / Expired Pass):** Reader shows a red **INVALID** alert and flags the reason (e.g., *"Did not tap in"* or *"Visitor Pass Expired"*).
     * In *both* cases, the system saves a `TicketInspection` record containing the `routeId`, `busId`, `timestamp`, and `isValid` result.
  4. **Transport Manager Analytics Dashboard:** The Transport Manager opens the web dashboard to generate the **3 required reports** from the case study:
     * **Fare Evasion Report:** Shows invalid ticket counts by route and time of day so managers know which routes need more ticket inspectors.
     * **Ridership & Overcrowding Report:** Uses Tap-In/Tap-Out data to show passenger volume by route, time of day, and day of the week to adjust bus timetables.
     * **Financial & Revenue Report:** Compares total fares deducted from journeys against total top-up and visitor pass revenue collected.

---

### **Flow 3: Account Top-Up & Journey/Expense History (Local Commuters)**

**Core Purpose:** How registered local commuters add credit to their account across different channels and export their travel history to claim expenses from their employers.

* **What was wrong in the old report:**
  * Promised 3 top-up channels (*Web Portal, Mobile App, Pay Station Kiosk*) in the text, but only drew `OnlineChannel` in the Class Diagram.
  * In Sequence Diagram 7.2, after a user paid, the system updated the balance but forgot to save the `TopUpTransaction` record into the account's history.
  * Included a "Logout" button on the sidebar despite the rubric saying not to include login/logout.
* **How the new flow works step-by-step:**
  1. **Selecting a Top-Up Channel:** The local commuter accesses their account (identified by their verified mobile number / account ID) via the **Web Portal**, **Mobile App**, or a **Station Pay Kiosk**.
  2. **Entering Top-Up Details:** The user views their current balance, selects a preset top-up amount (e.g., LKR 500, 1,000, 2,000) or custom amount, and chooses a payment method (Card/Online or Cash at a Pay Station).
  3. **Processing & Recording the Transaction:**
     * The system creates a `TopUpTransaction` and uses the `TopUpChannelFactory` to route the request through `OnlineChannel`, `MobileChannel`, or `PayStationChannel`.
     * The `PaymentGateway` authorizes the payment.
     * **If Approved:** The `Account` balance is increased, the transaction is marked `SUCCESS`, and the record is added to the account’s transaction history.
     * **If Declined:** The balance remains unchanged, the transaction is marked `FAILED`, and the user is notified with a retry option.
  4. **Viewing & Exporting Expense History:** From the same portal, the commuter can view their past bus journeys (start stop, end stop, date/time, and fare charged), filter by date (e.g., *Last 7 Days* or *Last 30 Days*), and export a **PDF/CSV Statement** to submit to their employer for travel expense reimbursement.

---

### **Flow 4: Bus Tap-In / Tap-Out & Configurable Fare Calculation**

**Core Purpose:** How the digital reader mounted inside the bus validates boarding, tracks the journey from start stop to end stop, and calculates the fare based on the city's configured fare rules.

* **What was wrong in the old report:**
  * In the Class Diagram, `FlatFareStrategy` was accidentally drawn as a child of `DistanceBasedFareStrategy` instead of implementing the `FareCalculationStrategy` interface directly.
  * The mandatory Sequence Diagram (7.1) was so blurry it couldn't be read.
  * Did not clearly handle what happens when a **Visitor with a 1/3/7-Day Pass** taps out versus a **Local Commuter paying per ride**.
* **How the new flow works step-by-step:**
  1. **Phase 1 — Tap-In (Boarding the Bus):**
     * Passenger holds their token (Smartcard or QR) near the Bus Boarding Reader at the starting bus stop.
     * The reader looks up the token in the `TokenRepository` (from Flow 1):
       * **For a Local Commuter (`AccountLinkedToken`):** Checks if the token is `ACTIVE` and the account balance is at least the minimum required boarding balance.
       * **For a Visitor (`VisitorToken`):** Checks if the pass is `ACTIVE` and the current time is before the pass's `expiryDateTime`.
     * **If Valid:** The reader plays a **single green audio/visual beep** (so the bus driver knows they can board) and creates a new `Journey` record (`status = IN_PROGRESS`, saving `boardingStop` and `boardingTime`).
     * **If Invalid (Low Balance or Expired Pass):** The reader plays a **red double-beep error alert** so the bus driver knows to stop the passenger from boarding.
  2. **Phase 2 — Tap-Out (Getting Off the Bus at Destination):**
     * When the bus reaches the destination stop, the passenger scans the same token at the reader to exit.
     * The system finds their open `Journey` record and records the `alightingStop` and `alightingTime` (`status = COMPLETED`).
     * *Why Visitors must also Tap-Out:* Even though a Visitor has a pre-paid 1/3/7-Day Pass, tapping out records their destination stop so the Transport Manager (in Flow 2) gets accurate overcrowding data!
  3. **Phase 3 — Multi-City Configurable Fare Calculation & Deduction:**
     * The system checks the city’s configured fare policy via `FareStrategyFactory`:
       * **Distance-Based Strategy:** Calculates fare based on distance/stops between `boardingStop` and `alightingStop`.
       * **Flat-Fare Strategy:** Charges a single fixed fare per ride regardless of distance.
       * **Peak / Off-Peak Strategy:** Applies a higher rate during rush hours and a discounted rate during off-peak hours.
     * **Deduction:**
       * **If Local Commuter (`AccountLinkedToken`):** The calculated fare is deducted from their `Account` balance, and the reader displays the **Fare Charged** and **Remaining Balance** with a confirmation beep.
       * **If Visitor (`VisitorToken`):** Because their 1/3/7-Day Pass was already paid upfront in Flow 1, **LKR 0.00** is deducted, and the reader displays **"Tap-Out Successful — Covered by Active Visitor Pass"**.

---

### **How All 4 Flows Connect Together as One System**

1. **Flow 1 (You)** creates the **Accounts** and **Tokens** (Local & Visitor) and saves them in the **`TokenRepository`**.
2. **Flow 3 (Member 3)** adds money to the **Local Accounts** created in Flow 1 and lets commuters export the **Journeys** created in Flow 4.
3. **Flow 4 (Member 4)** reads the **Tokens** from Flow 1 at the bus door, creates the **Journeys**, and deducts fares from the **Accounts** topped up in Flow 3.
4. **Flow 2 (Member 2)** checks the **Tokens** (Flow 1) and active **Journeys** (Flow 4) using the Inspector device, and aggregates data from **all flows** into the **Transport Manager Reports**.
