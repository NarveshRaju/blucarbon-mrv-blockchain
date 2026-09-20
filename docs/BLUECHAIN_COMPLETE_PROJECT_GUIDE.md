# BLUECHAIN: Comprehensive Project Guide & Technical Audit

---

## Table of Contents
1. [Executive Summary & Fundamental Concepts](#1-executive-summary--fundamental-concepts)
2. [The Complete User Journey & System Story](#2-the-complete-user-journey--system-story)
3. [Page-by-Page Architectural Breakdown](#3-page-by-page-architectural-breakdown)
4. [Routing & Navigation Engine](#4-routing--navigation-engine)
5. [Web3, Wallet Authentication & Identity](#5-web3-wallet-authentication--identity)
6. [Role-Based Access & Workspace Isolation](#6-role-based-access--workspace-isolation)
7. [NGO Onboarding & Profile Verification](#7-ngo-onboarding--profile-verification)
8. [Project Registration Multi-Step Wizard](#8-project-registration-multi-step-wizard)
9. [Geospatial Mapping & Analysis Zones](#9-geospatial-mapping--analysis-zones)
10. [Field Evidence & Proof Management](#10-field-evidence--proof-management)
11. [Environmental Baseline Modeling](#11-environmental-baseline-modeling)
12. [MRV (Measurement, Reporting, Verification) Engine](#12-mrv-measurement-reporting-verification-engine)
13. [Historical Observation Log Audit](#13-historical-observation-log-audit)
14. [DAO Verification & Governance Review](#14-dao-verification--governance-review)
15. [Project Lifecycle & Canonical State Machine](#15-project-lifecycle--canonical-state-machine)
16. [BCT Carbon Token & Smart Contract Minting](#16-bct-carbon-token--smart-contract-minting)
17. [Blockchain Architecture & On-Chain vs. Off-Chain Audit](#17-blockchain-architecture--on-chain-vs-off-chain-audit)
18. [MongoDB Database Architecture & Schema Audit](#18-mongodb-database-architecture--schema-audit)
19. [Express REST API & Backend Endpoints](#19-express-rest-api--backend-endpoints)
20. [Frontend Architecture (React 19, Contexts & Design System)](#20-frontend-architecture-react-19-contexts--design-system)
21. [Source File Inventory & Dependency Mapping](#21-source-file-inventory--dependency-mapping)
22. [Mock Data & Simulation Audit Table](#22-mock-data--simulation-audit-table)
23. [Real vs. Mock Classification Legend](#23-real-vs-mock-classification-legend)
24. [Engineering Roadmap to Full Production](#24-engineering-roadmap-to-full-production)
25. [Data Flow Diagrams](#25-data-flow-diagrams)
26. [End-to-End Real World Scenario](#26-end-to-end-real-world-scenario)
27. [What is Real Today vs. What is Simulated](#27-what-is-real-today-vs-what-is-simulated)
28. [Security & Vulnerability Audit](#28-security--vulnerability-audit)
29. [Complete Master Architecture Map](#29-complete-master-architecture-map)
30. [Beginner Glossary](#30-beginner-glossary)
31. ["If I Change This, What Breaks?" Dependency Guide](#31-if-i-change-this-what-breaks-dependency-guide)
32. [Recommended Beginner Learning Order](#32-recommended-beginner-learning-order)

---

# 1. Executive Summary & Fundamental Concepts

### What is BlueChain?
**BlueChain** is a decentralized web application designed to monitor, verify, and tokenize **Blue Carbon restoration projects** (such as coastal mangroves, seagrasses, and tidal wetlands). It connects local environmental organizations (NGOs) who plant and protect coastal ecosystems with decentralized validators who audit the data, and enterprise investors who purchase verified carbon credits.

### What Problem Does BlueChain Solve?
1. **Greenwashing & Lack of Transparency**: Traditional voluntary carbon markets suffer from opaque claims where buyers cannot easily verify whether planted trees actually exist or survive.
2. **High Verification Costs & Delays**: Traditional verification takes years and relies on manual paper audits by centralized agencies.
3. **Double Counting**: The same carbon credits are sometimes sold multiple times on different registries.
4. **Direct NGO Funding**: Local coastal communities and NGOs often receive only a small fraction of the funds paid by international carbon credit buyers.

### How Does BlueChain Solve This?
- **Blockchain Tokenization**: Carbon credits are represented as ERC-20 tokens (**BCT — Blue Carbon Token**) on Ethereum (Sepolia testnet), making issuance, ownership, and retirement transparent and immutable.
- **MRV (Measurement, Reporting, and Verification)**: Combines geotagged ground evidence (photos, legal permits) with satellite observation indices (NDVI vegetation vigor, biomass growth) to provide continuous proof of ecological recovery.
- **DAO Governance**: A community of certified validators inspects evidence, reviews satellite metrics, and approves projects before tokens are minted.

### Fundamental Terminology
- **Blue Carbon**: Carbon dioxide captured and stored by coastal and marine ecosystems—mainly mangroves, seagrass meadows, and salt marshes. Mangroves sequester up to 4–10 times more carbon per hectare than terrestrial tropical rainforests.
- **NGO (Non-Governmental Organization)**: The project developer/steward who physically restores coastal plots, records field baseline data, uploads photos, and receives minted BCT tokens upon approval.
- **Validator**: An independent auditor or DAO member who inspects uploaded field evidence, checks coordinate boundaries against satellite views, votes to approve/reject submissions, and stakes tokens to guarantee honest reviews.
- **Investor / Corporate Buyer**: An organization or individual seeking to offset greenhouse gas emissions by purchasing BCT tokens on the decentralized marketplace and permanently retiring (burning) them on-chain.
- **MRV**: **M**easurement, **R**eporting, and **V**erification. The scientific and operational pipeline of tracking environmental health over time.
- **Baseline**: The initial ecological condition (plot area, vegetation health, initial biomass) before restoration began. It is the benchmark against which future carbon sequestration is measured.
- **Carbon Credit (1 BCT)**: Standardized unit representing **1 metric ton of CO₂ equivalent (tCO₂e)** sequestered from the atmosphere.

---

# 2. The Complete User Journey & System Story

```
[1. Public Visitor] ──► Opens Landing Page / Project Explorer
         │
         ▼
[2. Connect Wallet] ──► MetaMask Web3 Handshake (Sepolia Network)
         │
         ▼
[3. Role Selection] ──► Choose: NGO Developer | Validator | Investor
         │
    ┌────┴──────────────────────────┬────────────────────────┐
    ▼                               ▼                        ▼
[NGO FLOW]                   [VALIDATOR FLOW]        [INVESTOR FLOW]
NGO Onboarding Profile       Review Queue (/verification) Browse Marketplace
    │                               │                        │
Project Registration Wizard  Inspect Geospatial & Proofs Buy & Trade BCT
 ├─ Step 1: Basic Details    Cast Vote (Approve/Reject)  Retire for Offsets
 ├─ Step 2: Interactive Map         │                        │
 ├─ Step 3: Evidence Upload         ▼                        ▼
 ├─ Step 4: Baseline Form    Smart Contract Minting     View Carbon Ledger
 └─ Step 5: Final Review            │
    │                               ▼
    ▼                        Tokens Deposited in
Submitted to DAO Queue ─────► NGO Wallet Address
```

---

# 3. Page-by-Page Architectural Breakdown

### 1. Landing Page
- **Route**: `/` (when wallet is disconnected)
- **Component**: `src/pages/LandingPage.js`
- **Purpose**: Public showcase introducing BlueChain's value proposition, MRV workflow, live network metrics, and role onboarding CTA buttons.
- **Actions**:
  - `Connect Wallet` → Triggers MetaMask popup via `Web3Context.connectWallet()`.
  - `Explore Projects` → Navigates to `/explore`.
  - `Select Role CTA` → Directs user into role selection after wallet handshake.
- **Data Source**: Aggregated from `getProjects()` API or initial mock statistics (e.g. Total Hectares, Carbon Sequestered).

### 2. Dashboard
- **Route**: `/` (when wallet is connected)
- **Component**: `src/pages/Dashboard.js`
- **Purpose**: Dynamic role-based command center:
  - **NGO View**: Displays organization profile status, project metrics (total, pending, approved), recent activity timeline, Next Actions Required card, and MRV lifecycle tracker.
  - **Validator View**: Displays pending review queue count, voting power, quick links to `/verification` and `/mrv-map`.
  - **Investor View**: Displays BCT balance, available credits, retired credits counter, and marketplace trading shortcuts.
  - **Unassigned Role**: Presents an interactive role selection card prompting the user to select an ecosystem role.
- **Data Source**: `getProjects()` (`/projects-for-sale`), `localStorage` (`bluechain_ngo_profile_<address>`), Web3 contract balance.

### 3. NGO Onboarding
- **Route**: `/ngo/onboarding`
- **Component**: `src/pages/NGOOnboarding.js`
- **Purpose**: Captures legal registration, organization details, mission, operational areas, and contact information for the NGO.
- **Actions**: Save Profile, Edit Details, Reset Data.
- **Data Storage**: Persisted in `localStorage` under `bluechain_ngo_profile_<walletAddress>` via `src/services/ngoService.js`.

### 4. Project Registration Wizard
- **Route**: `/ngo/submit`
- **Component**: `src/pages/SubmitProject.js`
- **Purpose**: 5-step wizard to register a new Blue Carbon project:
  1. *Basic Details*: Project Name, Description, Ecosystem Type, Trees/Saplings planted, Price.
  2. *Location & Analysis Zone*: Interactive Leaflet map with click-to-pin coordinate picker and adjustable analysis radius (100m–5000m).
  3. *Evidence Upload*: File selector supporting site photos and PDF permits with automatic Base64 conversion and category tagging.
  4. *Environmental Baseline*: Plot area, initial biomass, carbon stock, survey date, notes.
  5. *Final Review*: Comprehensive summary with submit button.
- **Backend API**: `POST /form` (creates project in MongoDB) followed by `POST /upload-base64/:projectId` (attaches structured evidence).

### 5. My Projects (NGO Project Tracker)
- **Route**: `/ngo/projects`
- **Component**: `src/pages/MyProjects.js`
- **Purpose**: Lists all projects owned by the connected NGO wallet, displaying synchronized lifecycle steppers, evidence badges, baseline status, and the **"List for Sale"** button for eligible approved projects.
- **Actions**: `View Project Details`, `List for Sale` (opens modal calling `POST /token/sell`), `Resubmit`.

### 6. Project Detail Page
- **Route**: `/project/:projectId`
- **Component**: `src/pages/ProjectDetail.js`
- **Purpose**: Detailed technical audit view for any project, including:
  - High-resolution interactive analysis zone map.
  - Evidence gallery with modal lightbox preview.
  - MRV environmental summary and timeline with "Record Observation" modal.
  - Verification activity audit log.
  - Role-specific actions: Validator Approve/Reject buttons, Admin Minting button.
- **Backend API**: `GET /forms/:id`, `PATCH /forms/:id/status`, smart contract `mintAndRecordApproval`.

### 7. DAO Verification (Review Queue)
- **Route**: `/verification`
- **Component**: `src/pages/Verification.js`
- **Purpose**: Validator workspace listing all projects with `status: "Pending"` awaiting consensus.
- **Actions**: Filter by ecosystem, search by name/location, quick link to inspect evidence and cast approval votes.
- **Backend API**: `GET /projects-for-sale`.

### 8. Public Project Explorer
- **Route**: `/explore`
- **Component**: `src/pages/ProjectExplorer.js`
- **Purpose**: Public discovery portal allowing visitors, researchers, and buyers to filter projects by status, ecosystem, carbon stock, and location; supports side-by-side project comparison.
- **Data Source**: Real MongoDB projects merged with centralized demo data via `src/utils/projectExplorerUtils.js`.

### 9. Carbon Credit Marketplace
- **Route**: `/marketplace`
- **Component**: `src/pages/Marketplace.js`
- **Purpose**: Decentralized trading desk where corporate buyers browse listed credits, add to cart, simulate purchase, and retire credits for carbon offset certificates.
- **Backend API**: `GET /projects-for-sale`, `POST /token/sell`, `POST /retire`.

### 10. MRV Satellite Map
- **Route**: `/mrv-map`
- **Component**: `src/pages/MRVMap.js`
- **Purpose**: Geospatial dashboard rendering all project boundaries on a global interactive Leaflet map with NDVI vegetation layers and biomass metrics.
- **Backend API**: `GET /projects-for-sale`.

### 11. Governance & DAO Proposals
- **Route**: `/governance`
- **Component**: `src/pages/Governance.js`
- **Purpose**: On-chain and off-chain DAO governance portal for voting on platform parameters, verification standards, and fund allocations.
- **Backend API**: `GET /proposals`, `POST /proposals`, `POST /proposals/:id/vote`.

### 12. Token Registry & Carbon Ledger
- **Route**: `/token-registry`
- **Component**: `src/pages/TokenRegistry.js`
- **Purpose**: Transparency explorer displaying all minted BCT tokens, contract address, total supply, transactions, and on-chain verification hashes.
- **Data Source**: Web3 smart contract calls (`totalSupply`, `balanceOf`) + backend transaction records.

### 13. Platform Analytics
- **Route**: `/analytics`
- **Component**: `src/pages/Analytics.js`
- **Purpose**: High-level statistical dashboard visualizing total carbon sequestered, hectares under restoration, species distribution charts, and economic volume.
- **Backend API**: `GET /projects-for-sale` + computed metrics.

### 14. User Profile & Wallet Settings
- **Route**: `/profile`
- **Component**: `src/pages/Profile.js`
- **Purpose**: Displays connected wallet address, current active role with role-switch button, BCT token balance, voting power, and recent transaction history.

---

# 4. Routing & Navigation Engine

### How Routing Works in React
In a Single Page Application (SPA), the browser does not reload entire HTML pages from a server when navigating. Instead, **React Router** (`react-router-dom`) monitors the browser URL in the address bar and conditionally renders the corresponding React component into the DOM.

```
URL Path                 Rendered Page Component     Allowed Role / Access
──────────────────────────────────────────────────────────────────────────
/ (disconnected)         <LandingPage />             Public (All visitors)
/ (connected)            <Dashboard />               All connected roles
/explore                 <ProjectExplorer />         Public (All visitors)
/ngo/onboarding          <NGOOnboarding />           NGO, Admin
/ngo/submit              <SubmitProject />           NGO, Admin
/ngo/projects            <MyProjects />              NGO, Admin
/verification            <Verification />            Validator, Admin
/project/:projectId      <ProjectDetail />           Public & All Roles
/marketplace             <Marketplace />             Investor, Admin, All
/governance              <Governance />              Validator, Investor, Admin
/mrv-map                 <MRVMap />                  Public & All Roles
/token-registry          <TokenRegistry />           Public & All Roles
/analytics               <Analytics />               Public & All Roles
/profile                 <Profile />                 All connected wallets
```

### Route Protection Implementation
- **Layout Level**: `Sidebar.js` conditionally renders navigation links based on `role` from `RoleContext`. For example, NGO links (`/ngo/submit`, `/ngo/projects`) only appear if `role === 'ngo'` or `role === 'admin'`.
- **Page Level**: Pages like `MyProjects.js` inspect `useRole()` and render an informative banner with role-switch guidance if an unauthorized role visits the URL directly.

---

# 5. Web3, Wallet Authentication & Identity

### What is MetaMask & Web3?
**MetaMask** is a non-custodial cryptocurrency wallet extension. In BlueChain, it serves as the user's digital identity and signature provider. There are no traditional usernames or passwords stored on a server. Instead, a user's identity is their public Ethereum address (e.g., `0x2452c923acCA12f97B8cA1797adbC4540468ab22`).

### Connection Sequence Trace
```
User clicks "Connect Wallet" button
  │
  ▼
Web3Context.js -> connectWallet() is invoked
  │
  ▼
window.ethereum.request({ method: "eth_requestAccounts" })
  │ (MetaMask opens popup asking user to approve connection)
  ▼
ethers.js BrowserProvider wraps window.ethereum
  │
  ▼
Signer extracts public walletAddress
  │
  ▼
RoleContext.loadRoleForAddress(walletAddress)
  │ (Checks localStorage for 'bcd_role_<walletAddress>')
  ▼
React State updated -> App switches from Landing Page to Dashboard
```

### Real vs. Mock Status of Authentication
- 🟢 **Real**: MetaMask connection, network detection (Sepolia), public address retrieval, on-chain BCT token balance queries (`balanceOf`), and smart contract owner detection.
- 🟡 **Limitation / Gap**: There is currently no backend cryptographic signature challenge (EIP-4361 / Sign-In With Ethereum). The frontend passes the public wallet address string in API request payloads, which the backend trusts without verifying a signed cryptographic nonce.

---

# 6. Role-Based Access & Workspace Isolation

BlueChain supports four distinct user roles:

| Role | Target Audience | Primary Capabilities | Persisted Storage |
|------|-----------------|----------------------|-------------------|
| **NGO Developer** (`ngo`) | Restoration stewards & field teams | Complete NGO profile, submit projects with maps & evidence, view project lifecycle, list tokens for sale. | `localStorage: bcd_role_<address>` |
| **Validator** (`validator`) | Certified auditors & marine ecologists | Audit pending submissions, inspect ground evidence & satellite indices, vote to Approve/Reject projects. | `localStorage: bcd_role_<address>` |
| **Investor** (`investor`) | Corporate buyers & offset purchasers | Browse verified carbon credits on marketplace, purchase tokens, permanently retire credits for certificates. | `localStorage: bcd_role_<address>` |
| **Admin** (`admin`) | Smart contract deployer / DAO authority | Trigger on-chain token minting, execute governance proposals, oversee global operations. | Auto-assigned if wallet matches contract owner address |

### Role Persistence
When a user selects a role in `<RoleSelector />`, `RoleContext.js` writes the key `bcd_role_${walletAddress.toLowerCase()}` to `localStorage`. When the user reconnects later with the same MetaMask address, `loadRoleForAddress()` automatically restores their role without prompting again.

---

# 7. NGO Onboarding & Profile Verification

### Purpose & Fields
Before an NGO can submit projects, it establishes its organizational identity through the onboarding form (`src/pages/NGOOnboarding.js`):

| Field Name | Description | Validation Rule | Storage Location | Real vs. Mock |
|------------|-------------|-----------------|------------------|---------------|
| `organizationName` | Full registered NGO name | Required, > 2 chars | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage (Frontend Persisted) |
| `registrationNumber` | Government / Trust registration ID | Required, alphanumeric | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |
| `organizationType` | Trust, Society, Section 8, International NGO | Required dropdown | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |
| `yearEstablished` | Founding year (e.g. 2018) | 1900 – Current Year | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |
| `officialEmail` | Contact email address | Valid email format | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |
| `contactNumber` | Phone number with country code | Phone regex | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |
| `state` & `district` | Geographic headquarters | Required selection | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |
| `areasOfWork` | Tags (Mangrove Restoration, Research, etc.) | Array of strings | `localStorage: bluechain_ngo_profile_<address>` | 🟡 Local Storage |

---

# 8. Project Registration Multi-Step Wizard

The project submission wizard (`src/pages/SubmitProject.js`) divides complex data collection into 5 intuitive stages:

```
[Step 1: Details] ──► [Step 2: Location] ──► [Step 3: Evidence] ──► [Step 4: Baseline] ──► [Step 5: Review]
```

### Data Flow on Final Submission:
1. **Form Construction**: The wizard aggregates all 5 step states into a unified payload.
2. **Database Record Creation**: Calls `POST /form` on Express server. The server writes the project document into MongoDB (`forms` collection) with `status: "Pending"`.
3. **Structured Evidence Attachment**: If evidence files were selected, calls `POST /upload-base64/:projectId` to store Base64 strings and file metadata in MongoDB.
4. **Baseline & MRV Persistence**: Writes initial baseline environmental metrics into `localStorage` (`bluechain_baseline_<projectId>`).
5. **Confirmation & Routing**: Shows a success confirmation card with formatted Project ID (`BC-XXXXXXXX`) and navigates to the NGO Project Tracker (`/ngo/projects`).

---

# 9. Geospatial Mapping & Analysis Zones

### How Mapping Works (`LocationPicker.js` & `AnalysisZoneMap.js`)
- **Technology**: **Leaflet.js** and **React-Leaflet** using OpenStreetMap tile layers.
- **Coordinate Selection**:
  - The user can click anywhere on the map to drop a pin.
  - Or type coordinates manually (e.g. `18.934688, 72.988298`).
  - Or select one of the pre-configured coastal mangrove hotspots (e.g. *Sundarbans Delta*, *Nhava Creek*, *Pichavaram*, *Bhitarkanika*).
- **Analysis Zone Radius**: The user selects a monitoring radius from 100 meters up to 5,000 meters. The map dynamically renders a translucent blue SVG circle around the center point.
- **Real vs. Mock**:
  - 🟢 **Real**: Interactive map rendering, geocoding coordinates, dynamic radius circle drawing, pan/zoom controls.
  - 🟠 **Simulated**: The polygon boundary does not yet make a live API call to European Space Agency (ESA) or NASA servers for real-time bounding-box satellite imagery clipping.

---

# 10. Field Evidence & Proof Management

### Why Evidence is Critical
To prevent fraudulent carbon claims, NGOs must provide documentary and photographic proof of restoration.

### Supported Evidence Categories:
1. **Site Photograph**: Ground-level photos of seedlings, tidal channels, and planting beds.
2. **Before / After Plantation**: Comparative photos demonstrating physical land transition.
3. **Field Survey**: GPS transect logs, tree height measurements, survival rate sheets.
4. **Permission / Authorization**: Government forestry clearance, coastal zone management permits.
5. **NGO Document**: Audit reports, community beneficiary lists.

### Technical Implementation:
- **File Reader**: `EvidenceUpload.js` uses HTML5 `FileReader` API to convert selected JPG, PNG, and PDF files into **Base64 Data URIs** on the client side.
- **Storage Location**:
  - Sent via `POST /upload-base64/:projectId` and stored in MongoDB inside `imageBase64s` array and `evidence` sub-document array.
  - Displayed in `ProjectDetail.js` with full lightbox zoom capability.

---

# 11. Environmental Baseline Modeling

### What is a Baseline?
An **Environmental Baseline** is the scientific measurement of the project site's ecological condition *before* or at the start of restoration.

### Baseline Parameters Captured (`BaselineForm.js`):
- **Project Area (Hectares)**: Total area under restoration (e.g. 25 ha).
- **Ecosystem Classification**: Coastal Mangrove Forest, Seagrass Meadow, Saltmarsh.
- **Dominant Species Category**: Rhizophora (Red Mangrove), Avicennia (Grey/Black Mangrove), Sonneratia.
- **Initial Biomass (t/ha)**: Metric tons of living plant matter per hectare (e.g. 42.5 t/ha).
- **Baseline Carbon Stock (tCO₂e)**: Existing carbon pool prior to planting (e.g. 68.2 tCO₂e).
- **Annual Sequestration Rate**: Estimated tons of CO₂ absorbed per hectare per year (e.g. 3.4 tCO₂e/yr).

---

# 12. MRV (Measurement, Reporting, Verification) Engine

### The MRV Breakdown:
- **Measurement (M)**: Recording physical indicators (satellite vegetation index NDVI, above-ground biomass, seedling survival rate).
- **Reporting (R)**: Formatting observations into standardized timeline records stored with timestamps and observation sources.
- **Verification (V)**: Independent review by DAO validators who cross-examine evidence against reported growth metrics before token approval.

### Scientific Metrics Defined:
- **NDVI (Normalized Difference Vegetation Index)**: Measures vegetation greenness and density on a scale from `-1.0` to `+1.0`. Healthy mangrove canopy typically scores between `0.55` and `0.85`.
- **EVI (Enhanced Vegetation Index)**: Similar to NDVI but optimized for high-biomass coastal canopy by correcting for atmospheric haze and background canopy scattering.
- **Biomass Growth Rate (% Change)**: Percentage increase in biological mass compared against the initial baseline.

---

# 13. Historical Observation Log Audit

### Audit Finding:
- **Current State**: In the current version, observation timeline records in `src/services/mockData.js` and `localStorage` are realistic scientific models (e.g. Sentinel-2 pass simulations showing NDVI growth from 0.58 to 0.71).
- **Classification**: 🟠 **Scientifically Modeled Demo Data**.
- **Path to Live Production**:
  1. Integrate Sentinel Hub API or Google Earth Engine API.
  2. Send project latitude, longitude, and radius.
  3. Query Sentinel-2 multispectral imagery (Bands 4 and 8 for NIR/Red).
  4. Compute $(B8 - B4) / (B8 + B4)$ in real time to calculate live NDVI.

---

# 14. DAO Verification & Governance Review

### The Validator Workflow
```
NGO Submits Project ──► Appears in /verification Queue ──► Validator Audits Evidence
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            ▼                                           ▼
                                    [Approve Project]                           [Reject Project]
                                            │                                           │
                                    Status -> "Approved"                        Status -> "Rejected"
                                    DAO consensus recorded                      Revision feedback saved
```

### Technical Execution:
- In `ProjectDetail.js`, clicking **"Approve Project"** issues a `PATCH /forms/:id/status` request with `{ status: "Approved" }`.
- MongoDB updates the document's `status` field.
- All cards and steppers across the platform instantly reflect the updated milestone.

---

# 15. Project Lifecycle & Canonical State Machine

To prevent visual inconsistencies, BlueChain enforces a **Single Source of Truth** for project lifecycle states in `src/utils/projectStatus.js`:

```
┌──────────┐     ┌─────────────┐     ┌──────────────────────┐     ┌────────────┐     ┌──────────────┐     ┌───────────────┐
│ 0. DRAFT │ ──► │ 1.SUBMITTED │ ──► │ 2.UNDER VERIFICATION │ ──► │ 3.APPROVED │ ──► │ 4.DAO REVIEW │ ──► │ 5.MINTED (BCT)│
└──────────┘     └─────────────┘     └──────────────────────┘     └────────────┘     └──────────────┘     └───────────────┘
```

| Canonical State Key | Badge Display | Stepper Progress | Description |
|---------------------|---------------|------------------|-------------|
| `draft` | `Draft` (Grey) | Step 0 Active | Project is being drafted in the wizard. |
| `submitted` / `pending` | `Pending` (Amber) | Steps 0 & 1 Completed (✓), Step 2 Active | Queued for independent DAO auditor review. |
| `under_verification` | `Under Verification` (Blue) | Steps 0 & 1 Completed (✓), Step 2 Active | Active inspection of coordinates & evidence in progress. |
| `approved` | `Approved` (Green) | Steps 0, 1, 2, 3 Completed (✓), Step 4 Active | Project certified; eligible for smart contract token minting. |
| `credit_issued` | `Tokens Minted` (Emerald) | All Steps 0 through 5 Completed (✓) | ERC-20 BCT tokens minted on Sepolia and listed on marketplace. |
| `rejected` | `Requires Revision` (Red) | Step 2 Rejected (✗) | Validator requested coordinate/evidence amendments. |

---

# 16. BCT Carbon Token & Smart Contract Minting

### Token Specifications:
- **Token Name**: Blue Carbon Token
- **Symbol**: `BCT`
- **Standard**: ERC-20 with Minting & Ownership Extensions
- **Decimals**: 18
- **Network**: Ethereum Sepolia Testnet
- **Contract Address**: Loaded dynamically from `src/contracts/BlueCarbonToken.json`

### Minting Execution Flow:
1. When a project is Approved, an authorized Admin or DAO multi-sig triggers minting.
2. The smart contract function `mintAndRecordApproval(recipientAddress, tokenAmount, offChainProjectId)` is executed on Sepolia.
3. The contract emits an on-chain event:
   ```solidity
   event ApprovalRecord(string indexed offChainProjectId, address indexed recipient, uint256 amountMinted);
   ```
4. Tokens are transferred to the NGO's MetaMask address, verifiable on [Sepolia Etherscan](https://sepolia.etherscan.io).

---

# 17. Blockchain Architecture & On-Chain vs. Off-Chain Audit

```
┌─────────────────────────────────────────────────────────────┐
│                    ON-CHAIN (Ethereum Sepolia)              │
│  • BCT ERC-20 Token Balance                                │
│  • Total Token Supply                                       │
│  • Smart Contract Ownership & Admin Multi-Sig               │
│  • Minting & Approval Event Logs                            │
│  • Token Retirement / Burn Hashes                           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Linked via MongoDB ProjectId
┌──────────────────────────────▼──────────────────────────────┐
│                    OFF-CHAIN (MongoDB & Express)            │
│  • Heavy Base64 Field Photos & PDF Documents                │
│  • High-Resolution Map Polygons & Geotags                   │
│  • Detailed Environmental Baseline Survey Notes             │
│  • Time-Series MRV Monitoring Logs                          │
│  • User Profiles & Organizational Registration Data         │
└─────────────────────────────────────────────────────────────┘
```

*Why this separation?* Storing megabytes of images directly on Ethereum would cost thousands of dollars in gas fees. High-volume data lives off-chain in MongoDB, while proof of existence, ownership, and value transfer reside immutably on-chain.

---

# 18. MongoDB Database Architecture & Schema Audit

### Primary MongoDB Collection: `forms` (Projects)

```javascript
const formSchema = new mongoose.Schema({
  ngoId: String,                // Unique NGO Identifier (e.g. 'NGO-REG-2018-9481')
  projectName: String,          // Human-readable project title
  description: String,          // Project description & objective
  location: String,             // Named location with coordinates
  plantationType: String,       // Ecosystem type ('Mangrove', 'Seagrass', etc.)
  saplingsPlanted: Number,      // Number of saplings / trees planted
  walletAddress: String,        // Ethereum wallet address of the NGO steward
  price: Number,                // Token price in ETH (set during marketplace listing)
  evidence: [evidenceItemSchema],// Array of structured evidence subdocuments
  imageBase64s: [String],       // Array of Base64 encoded image strings
  imageUrl: String,             // Azure Blob / CDN storage URL
  status: { type: String, default: "Pending" }, // 'Pending' | 'Approved' | 'Rejected'
  createdAt: { type: Date, default: Date.now }
});
```

---

# 19. Express REST API & Backend Endpoints

| Method | Endpoint | Purpose | Request Body | Database Action | Real / Mock |
|--------|----------|---------|--------------|-----------------|-------------|
| `GET` | `/projects-for-sale` | Fetches all projects with computed token metrics | None | `Form.find().sort({ createdAt: -1 })` | 🟢 REAL |
| `GET` | `/forms/:id` | Fetches single project by MongoDB ID | None | `Form.findById(id)` | 🟢 REAL |
| `POST` | `/form` | Creates a new project document | Project fields (JSON) | `Form.create(req.body)` | 🟢 REAL |
| `PATCH` | `/forms/:id/status` | Updates project approval status | `{ status: "Approved" }` | `Form.findByIdAndUpdate(id, { status })` | 🟢 REAL |
| `POST` | `/upload-base64/:id`| Attaches Base64 evidence files to project | `{ imageBase64s, evidence }` | `Form.findByIdAndUpdate(id, { $push })` | 🟢 REAL |
| `POST` | `/token/sell` | Lists project tokens for sale on marketplace | `{ projectId, pricePerToken }` | Updates project `price` field | 🟢 REAL |
| `POST` | `/retire` | Records carbon credit retirement / offset | `{ address, amount, txHash }` | Writes to `retirements` collection | 🟢 REAL |
| `GET` | `/proposals` | Fetches DAO governance proposals | None | `Proposal.find()` | 🟢 REAL |

---

# 20. Frontend Architecture (React 19, Contexts & Design System)

```
src/
 ├── components/       # Reusable modular UI widgets (Maps, Steppers, Uploaders)
 │    ├── ui/          # Core Design System (Button, Card, Input, StatusBadge, Modal)
 ├── pages/            # Full-page views corresponding to application routes
 ├── services/         # API abstraction layer (apiClient, projectService, ngoService)
 ├── utils/            # Pure helper utilities (projectStatus, geoUtils, explorerUtils)
 ├── contracts/        # Smart contract ABIs and network deployment configs
 ├── Web3Context.js    # Global React Context managing MetaMask & blockchain state
 └── RoleContext.js    # Global React Context managing role state & permissions
```

---

# 21. Source File Inventory & Dependency Mapping

```
src/
 ├── App.js                   # Application root, routing definitions, layout assembly
 ├── Web3Context.js           # Ethers.js provider, wallet connection, contract instance
 ├── RoleContext.js           # Active role state, role switching, localStorage persistence
 ├── index.js                 # React DOM mount point
 ├── index.css                # Global CSS variables, design tokens, responsive typography
 │
 ├── components/
 │    ├── Header.js           # Top navbar with wallet pill, network indicator, role badge
 │    ├── Sidebar.js          # Role-isolated navigation sidebar
 │    ├── RoleSelector.js     # Modal dialog for choosing NGO / Validator / Investor role
 │    ├── ProjectCard.js      # Reusable project card with badges, metrics, and actions
 │    ├── WorkflowStepper.js  # 5-stage project milestone stepper
 │    ├── ProjectLifecycle.js # 6-stage detailed lifecycle tracker with status banners
 │    ├── LocationPicker.js   # Interactive Leaflet coordinate & radius selector
 │    ├── AnalysisZoneMap.js  # Full-screen geospatial boundary viewer
 │    ├── EvidenceUpload.js   # Drag-and-drop file uploader with Base64 converter
 │    ├── BaselineForm.js     # Environmental baseline input form
 │    ├── MRVSummary.js       # MRV monitoring panel with live observation charts
 │    ├── MRVRecordModal.js   # Dialog for recording new field/satellite observations
 │    └── ui/                 # Design System primitives (Button, Card, Input, StatusBadge)
 │
 ├── pages/
 │    ├── LandingPage.js      # Public homepage for disconnected visitors
 │    ├── Dashboard.js        # Multi-role dashboard (NGO, Validator, Investor views)
 │    ├── NGOOnboarding.js    # NGO profile creation and verification form
 │    ├── SubmitProject.js    # 5-step project registration wizard
 │    ├── MyProjects.js       # NGO project management and token listing dashboard
 │    ├── ProjectDetail.js    # Comprehensive project audit view with map & evidence
 │    ├── Verification.js     # DAO validator project review queue
 │    ├── ProjectExplorer.js  # Public discovery portal with advanced filters & comparison
 │    ├── Marketplace.js      # Carbon credit purchase and retirement desk
 │    ├── Governance.js       # DAO voting proposals portal
 │    ├── MRVMap.js           # Global satellite map viewer
 │    ├── TokenRegistry.js    # On-chain token supply and transaction ledger
 │    ├── Analytics.js        # Global ecological and financial impact metrics
 │    └── Profile.js          # Wallet identity and role management settings
 │
 ├── services/
 │    ├── api.js              # Axios instance configured with backend baseURL
 │    ├── projectService.js   # Centralized project, baseline, MRV, and evidence service
 │    ├── ngoService.js       # NGO profile read/write operations
 │    └── mockData.js         # Centralized demo data generator for offline fallback
 │
 └── utils/
      ├── projectStatus.js    # Canonical state machine and lifecycle stage mapping
      ├── geoUtils.js         # Coordinate parsing, haversine distance, bounds math
      └── projectExplorerUtils.js # Filter, sort, and aggregation engine for Explorer
```

---

# 22. Mock Data & Simulation Audit Table

| Feature | Current Implementation Source | Classification | Why Implemented This Way | Path to Production Integration |
|---------|-------------------------------|----------------|--------------------------|--------------------------------|
| **Project Creation & Listing** | MongoDB `forms` collection via `server.js` | 🟢 REAL | Core backend database | Ready in production. |
| **Evidence Photo Upload** | Base64 in MongoDB via `/upload-base64` | 🟢 REAL | Self-contained storage | Migrate to Azure Blob Storage / IPFS Pinata for large files. |
| **BCT Token Minting** | Sepolia Smart Contract via `blockchain.js` | 🟢 REAL | Ethereum Sepolia testnet | Deploy to Ethereum Mainnet or Polygon L2. |
| **Interactive Map Pinning** | Leaflet.js + OpenStreetMap tiles | 🟢 REAL | Free open-source map tiles | Integrate Mapbox / Google Maps satellite imagery tiles. |
| **NDVI & Satellite Observations** | Scientifically modeled in `mockData.js` | 🟠 MOCK | Satellite APIs require paid keys | Integrate Sentinel Hub API / Google Earth Engine. |
| **DAO Governance Proposals** | MongoDB `proposals` collection | 🟢 REAL | Lightweight off-chain voting | Integrate Snapshot.org or OpenZeppelin Governor contract. |
| **NGO Profile Verification** | Browser `localStorage` per wallet | 🟡 PARTIAL | Isolated client state | Add dedicated `POST /ngo/profile` endpoint in MongoDB. |
| **Carbon Credit Retirement** | MongoDB `retirements` collection | 🟡 PARTIAL | Off-chain ledger tracking | Call ERC-20 `burn()` function on smart contract. |

---

# 23. Real vs. Mock Classification Legend

- 🟢 **REAL**: Actively connected to MongoDB, Express backend, or Ethereum Sepolia blockchain.
- 🟡 **PARTIAL**: Frontend logic and database exist, but lacks full cryptographic signature or cloud storage.
- 🟠 **MOCK**: UI and mathematics are fully implemented, but data is generated from realistic simulation models.
- 🔴 **NOT IMPLEMENTED**: Feature is conceptual only.

---

# 24. Engineering Roadmap to Full Production

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ Stage 1: Auth & Sign-In │ ──► │ Stage 2: Decentralized  │ ──► │ Stage 3: Live Satellite │
│ EIP-4361 Web3 Signature │     │ IPFS / Filecoin Storage │     │ Sentinel Hub API (NDVI) │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
             │                                                               │
             ▼                                                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ Stage 6: Security Audit │ ◄── │ Stage 5: On-Chain DAO   │ ◄── │ Stage 4: Polygon L2     │
│ Formal Contract Audit   │     │ OpenZeppelin Governor   │     │ Low-cost token minting  │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

# 25. Data Flow Diagrams

### Project Registration to Approval Flow:
```
[NGO User] ──(Fills 5-Step Wizard)──► SubmitProject.js
                                            │
                                            ▼
                                   projectService.js
                                            │
                              ┌─────────────┴─────────────┐
                              ▼                           ▼
                     POST /form (Details)     POST /upload-base64 (Photos)
                              │                           │
                              └─────────────┬─────────────┘
                                            ▼
                                   MongoDB Database
                                (Status: "Pending")
                                            │
                                            ▼
[DAO Validator] ◄──(Loads /verification)────┘
      │
      ▼ (Clicks "Approve")
PATCH /forms/:id/status ──► MongoDB (Status: "Approved")
                                  │
                                  ▼
[Admin / DAO] ──────────► Smart Contract (mintAndRecordApproval)
                                  │
                                  ▼
                     BCT Tokens Deposited to NGO Wallet
```

---

# 26. End-to-End Real World Scenario

1. **Steward**: *Mangrove Conservation Trust* connects MetaMask wallet `0x2452...ab22`.
2. **Role Setup**: Selects **NGO Developer**; completes profile for 100 hectares in *Sundarbans, West Bengal*.
3. **Registration**:
   - Drops pin at coordinates `21.9497, 89.1833` with a 1,500m radius.
   - Attaches 3 site photos and a Coastal Zone Regulation clearance certificate.
   - Enters baseline: 45 t/ha initial biomass, 3,000 saplings planted.
4. **Submission**: Project `BC-Sundarbans-01` is saved to MongoDB in `Pending` state.
5. **Validation**: Certified validator reviews geotagged photos and NDVI index on `/verification`, voting **Approve**.
6. **Tokenization**: Contract mints 3,000 BCT tokens directly to the Trust's wallet.
7. **Offset Sale**: Trust lists 1,500 BCT on the Marketplace at 0.02 ETH each.
8. **Corporate Retirement**: An enterprise buyer purchases 500 BCT and burns them for an official on-chain offset certificate.

---

# 27. What is Real Today vs. What is Simulated

### What is Genuinely Real Today:
- ✅ Full MetaMask Web3 wallet connection and account switching.
- ✅ Dynamic multi-role UI routing (NGO, Validator, Investor workspaces).
- ✅ Multi-step project creation writing directly to MongoDB.
- ✅ Field evidence file encoding (Base64) and database persistence.
- ✅ Interactive Leaflet maps with coordinate geocoding and radius drawing.
- ✅ Live BCT ERC-20 token minting on Ethereum Sepolia testnet.
- ✅ Synchronized 6-stage project lifecycle state machine.
- ✅ Public project exploration with multi-attribute filtering and comparison.

### What is Currently Simulated:
- ⚠️ Satellite NDVI readings use realistic mathematical models rather than live Sentinel-2 satellite API feeds.
- ⚠️ Evidence files are stored in MongoDB as Base64 rather than on IPFS / Azure Blob Storage.
- ⚠️ Validator voting updates database state directly rather than executing through an on-chain Governor contract.

---

# 28. Security & Vulnerability Audit

1. **Wallet Authentication**:
   - *Current*: Frontend passes wallet address in request body.
   - *Recommendation*: Implement cryptographic challenge signing (EIP-4361) on the backend to verify wallet ownership.
2. **Payload Size Limits**:
   - *Current*: `bodyParser.json({ limit: "50mb" })` allows large Base64 uploads.
   - *Recommendation*: Enforce strict 5MB per-file limits and offload storage to IPFS/S3.
3. **Environment Secrets**:
   - *Audit Check*: Private keys and RPC URLs are properly loaded from `.env` and never hardcoded in client-side bundles.

---

# 29. Complete Master Architecture Map

```
                                  BLUECHAIN PLATFORM
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
   [FRONTEND CLIENT]             [EXPRESS BACKEND]            [ETHEREUM BLOCKCHAIN]
   • React 19 SPA                • Node.js REST API           • Sepolia Testnet
   • Ethers.js Web3 Provider     • MongoDB / Mongoose         • BlueCarbonToken (ERC-20)
   • React Router Routing        • Multer / Body-Parser       • mintAndRecordApproval()
   • Leaflet Geospatial Engine   • Blockchain Minting Service • balanceOf() & totalSupply()
   • Pure CSS Design System      • CORS & Security Layer      • On-chain Approval Events
```

---

# 30. Beginner Glossary

- **API (Application Programming Interface)**: A structured way for the frontend website to request data from the backend server.
- **Base64**: A method of converting binary files (like photos and PDFs) into text strings so they can be easily transmitted over the internet.
- **DAO (Decentralized Autonomous Organization)**: A community-governed organization where decisions are made by stakeholder voting rather than a central executive.
- **ERC-20**: The global technical standard for fungible tokens on the Ethereum blockchain.
- **Ethers.js**: The JavaScript library that allows React applications to communicate with the Ethereum blockchain.
- **Leaflet**: An open-source JavaScript library used for building interactive, mobile-friendly web maps.
- **Mongoose**: A Node.js library that provides strict data modeling and schema validation for MongoDB.
- **NDVI**: Normalized Difference Vegetation Index—a satellite calculation that measures plant greenness and photosynthetic vigor.
- **Non-Custodial Wallet**: A crypto wallet (like MetaMask) where only the user holds their private keys; the platform never holds or controls user funds.
- **SPA (Single Page Application)**: A modern web application that dynamically updates the current web page without reloading the entire page from a server.

---

# 31. "If I Change This, What Breaks?" Dependency Guide

```
File Modified               Potential Impact & Downstream Dependencies
────────────────────────────────────────────────────────────────────────────────────────
src/utils/projectStatus.js  ► Stepper dots, card badges, lifecycle progress, filter tabs
src/Web3Context.js          ► MetaMask connection, balance displays, minting triggers
src/RoleContext.js          ► Role selector modal, sidebar menus, route permissions
src/services/projectService.js ► Project lists, detail pages, baseline calculations
src/backend/server.js       ► All REST API endpoints, MongoDB queries, form creation
src/backend/blockchain.js   ► Smart contract interaction, token minting on Sepolia
```

---

# 32. Recommended Beginner Learning Order

To master the BlueChain codebase, read the source files in this exact sequence:

1. **The Big Picture**: Read `README.md` and this document (`docs/BLUECHAIN_COMPLETE_PROJECT_GUIDE.md`).
2. **Web3 & Roles**: Inspect `src/Web3Context.js` followed by `src/RoleContext.js`.
3. **Application Routing**: Inspect `src/App.js` and `src/components/Sidebar.js`.
4. **Data Models & State Machine**: Inspect `src/utils/projectStatus.js` and `src/services/mockData.js`.
5. **API Services**: Read `src/services/api.js`, `src/services/projectService.js`, and `src/services/ngoService.js`.
6. **Project Submission**: Read `src/pages/SubmitProject.js` and its subcomponents (`LocationPicker.js`, `EvidenceUpload.js`, `BaselineForm.js`).
7. **Project Management & Audit**: Read `src/pages/MyProjects.js`, `src/pages/ProjectDetail.js`, and `src/pages/Verification.js`.
8. **Backend & Database**: Inspect `src/backend/server.js` to understand MongoDB models and Express routes.
9. **Smart Contracts**: Inspect `src/backend/blockchain.js` and `src/contracts/BlueCarbonToken.json`.
