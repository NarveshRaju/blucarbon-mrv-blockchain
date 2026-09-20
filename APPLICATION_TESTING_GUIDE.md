# BlueChain — Complete End-to-End Application Testing Guide

This document provides a comprehensive, step-by-step procedure to test and verify the entire **BlueChain** application from NGO project registration to AI Pre-Verification, Validator Audit, DAO Governance Consensus, and On-Chain Carbon Token Minting.

---

## 🚀 Prerequisites & System Startup

Ensure both your backend and frontend development servers are active.

### 1. Start the Express / MongoDB Backend Server
Open a terminal in the project root:
```bash
cd "src/backend"
node server.js
```
*Expected Console Output:*
```
🚀 Server running on port 5000
MongoDB connected successfully to forms_db
```

### 2. Start the React Frontend Application
Open a second terminal in the project root:
```bash
npm start
```
*Expected Output:*
```
Compiled successfully!
Local: http://localhost:3000
```

---

## 🧭 Navigation & Role Reference Table

| Role | Primary Route | Key Responsibilities |
|---|---|---|
| **NGO Steward** | `/ngo/projects` | Register projects, upload evidence, run AI screening, list tokens for sale |
| **Validator** | `/verification` & `/ai-verification` | Inspect evidence, audit AI screening findings, approve projects for DAO |
| **DAO Member** | `/dao` | Review validated proposals, cast governance votes, achieve consensus |
| **Investor** | `/marketplace` | Browse verified blue carbon projects, buy BCT tokens, retire credits |
| **Admin** | `/` (Dashboard) | Overall system monitoring, trigger Sepolia blockchain token minting |

---

## 📋 Step-by-Step Testing Procedure

---

### STEP 1: Connect MetaMask Wallet & Complete NGO Onboarding

1. Open your browser and navigate to **`http://localhost:3000`**.
2. Click the **"Connect Wallet"** button in the top navigation bar and approve the MetaMask connection (use the **Sepolia Testnet**).
3. In the top navigation bar, use the **Role Switcher dropdown** and switch to **`NGO`**.
4. If you have not yet completed onboarding:
   * You will be prompted to complete the 3-step NGO profile (*Organization Name, Official Registration Number, Coastal Ecosystem Domain*).
   * Submit to save your profile to MongoDB.

---

### STEP 2: Register a New Blue Carbon Project

1. Click **"Submit Project"** in the top navigation bar or navigate directly to **`http://localhost:3000/ngo/submit`**.
2. Follow the 5-step registration wizard:

   * **Step 1 — Basic Project Details**:
     * **Project Name**: `Sundarbans Delta Mangrove Restoration`
     * **Plantation Type**: `Avicennia marina` (or `Rhizophora mucronata`)
     * **Start Date**: Choose a valid past or current date.
     * **Description**: Enter a detailed description (minimum 20 characters) describing the restoration methodology, community involvement, and tidal zone management.
     * Click **"Save & Continue"**.

   * **Step 2 — Location & Interactive Map Picker**:
     * Click on the interactive Leaflet map to drop a pin on a coastal mangrove region (e.g., Sundarbans coordinates: `21.845, 88.921`).
     * Set **Declared Area**: `250` hectares.
     * Click **"Save & Continue"**.

   * **Step 3 — Analysis Zone & Buffer Radius**:
     * Adjust the circular analysis zone slider (e.g., `2,500` meters).
     * Verify the circular geofence buffer updates visually on the map.
     * Click **"Save & Continue"**.

   * **Step 4 — Baseline MRV Data**:
     * **Initial Biomass Density**: `35.5` tonnes dry biomass / hectare.
     * **Soil Organic Carbon**: `120.0` tC / hectare.
     * **Saplings Planted**: `250,000` trees.
     * **Tree Species**: `Avicennia marina`.
     * Click **"Save & Continue"**.

   * **Step 5 — Evidence Documents & Photos**:
     * Upload supporting documents (e.g., Land authorization certificate, government permission letter, field baseline photographs).
     * Assign categories to each upload (*Land Authorization, NGO Registration, Field Photograph*).

3. Click **"Submit Project to Network"**.
4. The project is stored in MongoDB with status `submitted`. You will be redirected to **"My Projects"** (`http://localhost:3000/ngo/projects`).

---

### STEP 3: Execute Real AI Pre-Verification Screening

1. Go to **"My Projects"** (`http://localhost:3000/ngo/projects`) and click on your newly submitted project to open the **Project Detail** page.
2. Below the 6-stage **Project Lifecycle Stepper**, locate the **AI Pre-Verification Card** (Status: *Waiting for AI Analysis*).
3. Click the **"Start AI Pre-Verification"** button.
4. **Observe Real-Time Analysis**:
   * The engine executes the 5 real investigation dimensions:
     1. *Evidence Authenticity & SHA-256 Checksum Hashing*
     2. *Gemini Semantic Document Analysis & OCR Text Extraction*
     3. *Geographic Location & Coordinate Haversine Alignment*
     4. *Copernicus Sentinel-2 Remote Sensing Optical Calculations*
     5. *Mangrove Biophysical Growth Ceiling & Carbon Accounting*
5. Once completed, inspect the resulting **AI Pre-Verification Report**:
   * **Overall Banner**: Displays recommendation (`PASSED_FOR_HUMAN_REVIEW`, `NEEDS_INFORMATION`, or `FLAGGED_FOR_MANUAL_REVIEW`).
   * **Investigation Dimensions Tab**:
     * **Land & Authorization**: Evaluates evidence documents with explicit legal ownership caveats.
     * **NGO Consistency**: Matches document entities against submitting NGO profile.
     * **Geographic Alignment**: Shows distance check and circular buffer overlap percentage.
     * **Evidence Hashes**: Displays cryptographic SHA-256 table and cross-project duplicate checks.
     * **Biophysical Growth**: Audits planting density against silvicultural bounds ($500-5000\,\text{trees}/\text{ha}$) and biomass accumulation ceiling ($25\,t/\text{ha}/\text{yr}$).
   * **Copernicus Satellite Tab**: Displays Sentinel-2 optical formulas ($\text{NDVI} = \frac{\text{B8}-\text{B4}}{\text{B8}+\text{B4}}$ and $\text{EVI}$) and bounding box metadata.
   * **Biomass & Carbon Tab**: Displays Komiyama allometric biomass model and IPCC $\text{CO}_2\text{e}$ carbon accounting audit trail.
6. **Handling Corrections (If `NEEDS_INFORMATION`)**:
   * If required documents were missing, click **"Resolve Action Items"** to navigate directly to wizard Step 5, upload required files, and click **"Re-run AI Verification"** (creates an immutable `Run #2` record).

---

### STEP 4: Certified Validator Review

1. In the top navigation bar, switch your role dropdown to **`Validator`**.
2. Navigate to **"Review Queue"** (`http://localhost:3000/verification`) or **"AI Screening Agent"** (`http://localhost:3000/ai-verification`).
3. Locate your project in the queue (it will display `AI Pre-Screening: Eligible for Review` or `Passed`).
4. Click **"Review Project"** to enter the validator audit workspace.
5. Review the uploaded evidence files, satellite reflectance values, and interactive analysis zone map.
6. Click **"Approve for DAO Consensus"** (or *"Request Revision"* if rejecting).
7. The project status updates to `validator_approved` / `dao_review`.

---

### STEP 5: DAO Governance Consensus & Community Voting

1. Navigate to **"DAO Governance"** (`http://localhost:3000/dao`).
2. Locate the active proposal created for your approved project.
3. Inspect proposal parameters (*Project Name, Target Hectares, Estimated Carbon Credits, NGO Steward Wallet*).
4. Click **"Vote For"** to cast your governance vote.
5. Once the voting threshold is achieved, the proposal status advances to **"DAO Approved (Ready to Mint)"**.

---

### STEP 6: Smart Contract BCT Token Minting & Decentralized Marketplace

1. Open the project detail page (`http://localhost:3000/project/<ID>`).
2. As Admin or NGO Steward, locate the **"Mint Carbon Credits On-Chain"** action.
3. Click **"Mint Carbon Credits"**:
   * MetaMask will prompt to sign the Sepolia smart contract transaction.
   * ERC-20 `BCT` tokens are minted directly into the NGO steward's wallet address.
   * Project status advances to **"Credits Issued (BCT Minted)"**.
4. In the top navigation bar, switch role to **`Investor`** and navigate to **"Marketplace"** (`http://localhost:3000/marketplace`):
   * Inspect the live project credit listing with token price in ETH.
   * Test purchasing BCT tokens or retiring credits to generate a cryptographic carbon offset retirement certificate.

---

## 🔍 Validation & Health Check Matrix

| Feature / Dimension | Validation Check | Expected Result |
|---|---|---|
| **Form Data Isolation** | Log in with a different NGO wallet. | Only the connected NGO's projects are displayed. |
| **Zero Mock Data** | Inspect API responses in browser Network tab. | No `Math.random()`, no fake `79/100` scores; all figures derive from real formulas. |
| **Sentinel-2 Indices** | Check Copernicus Satellite tab in AI report. | Real formulas: $\text{NDVI} = \frac{\text{B8}-\text{B4}}{\text{B8}+\text{B4}}$, $\text{EVI} = 2.5 \times \frac{\text{B8}-\text{B4}}{\text{B8}+6\text{B4}-7.5\text{B2}+1}$. |
| **Evidence Hashes** | Inspect evidence table in AI report. | Real cryptographic 64-character SHA-256 checksums for each file. |
| **Multi-Run History** | Fix issues and re-run AI verification. | Dropdown allows toggling between `Run #1` and `Run #2`. |
| **Validator Queue Sync** | Project in `PROCESSING` or `NEEDS_INFORMATION`. | Does **NOT** appear in Validator Queue or DAO Review until passed. |
| **DAO Consensus** | Submit project without validator approval. | Direct NGO $\rightarrow$ DAO bypass is blocked; validator audit required. |

---

## 🛠️ Verification & Build Commands

* **Check backend syntax**:
  ```bash
  node -c src/backend/server.js
  ```
* **Validate frontend production build**:
  ```bash
  npm run build
  ```
  *(Must compile successfully with 0 errors and 0 warnings).*
