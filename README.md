# NAVBODH (नवबोध)
### Personalized Skill Intelligence & Learning Platform for India's Official Statistical System

> **Stage 1: Core Foundation** | Smart India Hackathon 2026  
> **Repository:** [pallavsharma-7/NAVBODH](https://github.com/pallavsharma-7/NAVBODH)  
> **Current Branch:** `navbodh-core`  
> **Lead Contributor (Core Foundation):** Tanishka  

---

## 1. Executive Overview & Problem Statement

The **National Statistical System (NSS)** of India—comprising the Ministry of Statistics and Programme Implementation (MoSPI), the National Statistical Systems Training Academy (NSSTA), and State Directorates of Economics and Statistics (DES)—relies on specialized human capital across statistical methodology, data processing, national accounts, survey sampling, and digital governance.

### Core Problem
Officers across various statistical cadres possess diverse skill levels. Traditional training approaches lack personalized diagnostic mechanisms, clear competency baselines, and data-driven learning roadmaps. 

### NAVBODH Solution
**NAVBODH** establishes a closed-loop skill intelligence ecosystem:
```
Employee Profile
      ↓
Competency Assessment
      ↓
Skill-Gap Identification (Stage 2: Rucha)
      ↓
Personalized Recommendations (Stage 2: Rucha)
      ↓
Learning Roadmap (Stage 2: Rucha)
      ↓
Interactive Learning (Stage 3: Pathika)
      ↓
Knowledge Quizzes (Stage 3: Pathika)
      ↓
Competency & Progress Update (Stage 3: Pathika)
      ↓
Growth Calculation & Achievements (Stage 4: Pallav)
      ↓
Workforce & Admin Analytics (Stage 5: Palak)
```

**Key Differentiator:** *Growth-Based Gamification*. Rather than ranking officers solely on static absolute test scores, NAVBODH measures individual improvement relative to the officer's own permanent baseline:
$$\text{Growth \%} = \frac{\text{Current Score} - \text{Baseline Score}}{\text{Baseline Score}} \times 100$$

---

## 2. Architecture & Technology Stack

NAVBODH is built on a compact, resilient, high-performance full-stack architecture without unnecessary framework overhead:

- **Frontend:** HTML5, Vanilla JavaScript (Modular ES6), Vanilla CSS (Custom Design System Token Architecture with Google Font `Audiowide` and system typography).
- **Backend:** Node.js (v24.x LTS), Express.js (v4.21.x REST API).
- **Database:** SQLite (Relational engine via `better-sqlite3` with WAL mode & foreign key constraints).
- **Authentication:** Server-side sessions with cryptographic session tokens (`crypto.randomBytes`) stored in the SQLite `sessions` table, `HttpOnly` security cookies, and Bcrypt password hashing.
- **Authorization:** Role-Based Access Control (RBAC) enforced in backend middleware (`employee` vs `admin`).
- **Communication:** Standardized REST/JSON contract.

---

## 3. Directory Structure

```
NAVBODH/
├── package.json               # NPM scripts and production dependencies
├── server.js                  # Main Express server assembly and route mounting
├── db.js                      # SQLite connection, WAL mode, and complete relational schema
├── seed.js                    # Seeder for fictional demo users, competencies, questions & courses
├── .gitignore                 # Exclusion rules (node_modules, .env, *.sqlite)
├── README.md                  # System architecture, credentials, API contract, and handoff
│
├── middleware/
│   └── auth.js                # Server session manager, HttpOnly cookie handler, RBAC middleware
│
├── routes-auth.js             # Authentication endpoints (/api/auth/login, logout, me)
├── routes-core.js             # Core endpoints (/api/health, profile, competencies, assessment)
├── routes-intelligence.js     # [Stage 2: Rucha] Safe route boundary for skill-gap & recommendations
├── routes-learning.js         # [Stage 3: Pathika] Safe route boundary for courses & lessons
├── routes-gamification.js     # [Stage 4: Pallav] Safe route boundary for leaderboard & rewards
├── routes-admin.js            # [Stage 5: Palak] Core admin boundary & overview metrics
│
├── public/                    # Frontend Single Page Application (SPA)
│   ├── index.html             # Application shell, navigation, and role-based views
│   ├── styles.css             # NAVBODH design tokens, palette, and block/pixel UI styling
│   ├── api.js                 # Reusable HTTP client wrapper for all API operations
│   ├── employee.js            # Employee portal, profile management & assessment engine
│   └── admin.js               # Administrator dashboard & audit logging
│
└── test/
    └── test-core.js           # Automated end-to-end test suite (17 comprehensive test cases)
```

---

## 4. Relational Database Schema

The SQLite database (`navbodh.sqlite`) defines 17 relational entities supporting Stage 1 and future stages:

| Table | Stage / Owner | Description |
| :--- | :--- | :--- |
| `users` | Stage 1 (Tanishka) | Officer & admin profiles, credentials, department link |
| `departments` | Stage 1 (Tanishka) | Official MoSPI / NSSTA wings (NAD, SDRD, FOD, ESD, DIID, NSSTA) |
| `competencies` | Stage 1 (Tanishka) | 17 competencies across 4 official domains (Statistical, Technical, Governance, Behavioural) |
| `employee_competencies`| Stage 1 (Tanishka) | Officer baseline scores, current scores, and targets |
| `assessments` | Stage 1 (Tanishka) | Baseline & periodic assessment configurations |
| `assessment_questions`| Stage 1 (Tanishka) | Questions, options JSON, difficulty, server-side answer keys |
| `assessment_attempts` | Stage 1 (Tanishka) | Completed evaluation records, baseline flags, score breakdowns |
| `courses` | Stage 3 (Pathika) | Sample training courses (`sample_igot`, `sample_nssta_tpac`, `local_demo`) |
| `course_competencies` | Stage 3 (Pathika) | Competency mapping and growth impact scores |
| `lessons` | Stage 3 (Pathika) | Structured modules within courses |
| `learning_materials`  | Stage 3 (Pathika) | Reading references, datasets, and guides |
| `learning_progress`   | Stage 3 (Pathika) | Officer enrollment status and completion percentages |
| `quizzes`             | Stage 3 (Pathika) | Post-lesson knowledge verification quizzes |
| `quiz_attempts`        | Stage 3 (Pathika) | Quiz attempt history and pass status |
| `reward_ledger`       | Stage 4 (Pallav)  | Points ledger tracking for gamification events |
| `achievement_definitions` | Stage 4 (Pallav) | Badges, trophies, and milestone unlock rules |
| `employee_achievements`| Stage 4 (Pallav)  | Officer achievement unlock history |
| `sessions`            | Stage 1 (Tanishka) | Server-side cryptographic session store |

---

## 5. Competency Framework

The framework includes 17 representative competencies across 4 official domains:

1. **Statistical Domain:**
   - `STAT_SURVEY_DESIGN` — Survey Design & Sampling Frames
   - `STAT_SAMPLING` — Sampling Techniques & Variance Estimation
   - `STAT_NAT_ACCOUNTS` — National Accounts & GDP Compilation (SNA 2008)
   - `STAT_SDG_INDICATORS` — SDG Indicators & Monitoring Framework
   - `STAT_DATA_QUALITY` — Data Quality Frameworks & NQAF
2. **Technical Domain:**
   - `TECH_PYTHON` — Python for Statistical Analysis & Automation
   - `TECH_SQL` — SQL & Relational Database Querying
   - `TECH_DATA_VIZ` — Data Visualization & Dashboarding
   - `TECH_AI_ML` — Machine Learning & Applied Predictive Analytics
   - `TECH_APIS` — APIs & Automated Data Ingestion
3. **Digital Governance Domain:**
   - `GOV_CYBERSECURITY` — Cybersecurity & Threat Mitigation
   - `GOV_DATA_PRIVACY` — Data Privacy & DPDP Act Safeguards
   - `GOV_CLOUD` — Government Cloud Infrastructure (MeghRaj/NIC)
4. **Behavioural / Managerial Domain:**
   - `BEH_LEADERSHIP` — Strategic Leadership & Public Sector Vision
   - `BEH_COMMUNICATION` — Executive Statistical Communication & Briefing
   - `BEH_PROJECT_MGMT` — Statistical Project & Field Management
   - `BEH_ETHICS` — Professional Ethics & Scientific Objectivity

---

## 6. Shared API Response Contract

Every endpoint in NAVBODH adheres to the unified response contract:

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (`400`, `401`, `403`, `404`, `500`, `501`)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable explanation of error condition."
  }
}
```

---

## 7. Working API Endpoints (Stage 1 Core)

| Method | Endpoint | Auth Required | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | Public | Health check & SQLite connectivity status |
| `GET` | `/api/departments` | No | Public | List official departments and divisions |
| `GET` | `/api/competencies` | No | Public | List 17 competencies grouped by domain |
| `POST` | `/api/auth/login` | No | Public | Authenticate user, issue HttpOnly session cookie |
| `POST` | `/api/auth/logout` | Yes | Any | Invalidate session in DB and clear cookie |
| `GET` | `/api/auth/me` | Yes | Any | Get current authenticated user session |
| `GET` | `/api/profile` | Yes | Employee | Get officer profile, baseline status & growth |
| `PATCH`| `/api/profile` | Yes | Employee | Update officer designation, cadre, phone, bio |
| `GET` | `/api/assessment` | Yes | Employee | Fetch assessment questions (answers hidden) |
| `POST`| `/api/assessment/submit` | Yes | Employee | Submit answers, score, establish baseline |
| `GET` | `/api/assessment/result` | Yes | Employee | Get latest assessment results & review |
| `GET` | `/api/admin/overview` | Yes | Admin | System statistics & audit log of assessments |

---

## 8. Demo Credentials

The database is seeded with fictional demo accounts for testing and verification:

| Username | Password | Role | Name | Department / Cadre |
| :--- | :--- | :--- | :--- | :--- |
| `emp.sharma` | `Password123!` | `employee` | Priya Sharma | National Accounts Division (SSS) |
| `emp.verma` | `Password123!` | `employee` | Rajesh Verma | Survey Design & Research Division (ISS) |
| `admin.navbodh` | `AdminPass123!` | `admin` | Dr. Anil Kumar | NSSTA Training Director / Admin |

> **Note:** Quick-fill buttons are provided on the login page for instantaneous credential selection.

---

## 9. Installation & Running Locally

### Prerequisites
- Node.js (v18.x or v20.x or v24.x)
- NPM (v9.x or v10.x or v11.x)

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (Optional - server auto-seeds on first launch if empty)
```bash
npm run seed
```

### 3. Run Application
```bash
npm start
```
Access the application at: **`http://localhost:3000`**

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 10. Implementation Sequence & Safe Route Boundaries

NAVBODH follows a strictly staged implementation roadmap:

1. **Stage 1 (Current): Tanishka — Core Foundation** (`navbodh-core`)
   - Complete project foundation, Express server, SQLite schema, Bcrypt authentication, HttpOnly sessions, RBAC, profile management, competency baseline assessment, permanent baseline immutability, frontend SPA shell, and shared API wrapper.
2. **Stage 2: Rucha — Intelligence** (`rucha-intelligence`)
   - Skill-gap identification algorithm, personalized learning recommendations, dynamic learning roadmap, AI study assistant.
   - *Scaffolded route:* `routes-intelligence.js` (`/api/intelligence/*`)
3. **Stage 3: Pathika — Learning** (`pathika-learning`)
   - Course enrollment, lesson content delivery, interactive quizzes, learning progress tracking.
   - *Scaffolded route:* `routes-learning.js` (`/api/learning/*`)
4. **Stage 4: Pallav — Gamification** (`pallav-gamification`)
   - Growth-based leaderboard: $((\text{Current} - \text{Baseline}) / \text{Baseline}) \times 100$, reward ledger, achievements unlocking logic, milestones.
   - *Scaffolded route:* `routes-gamification.js` (`/api/gamification/*`)
5. **Stage 5: Palak — Admin + Integration** (`palak-admin`)
   - Workforce skill heatmaps, iGOT/NSSTA curriculum curation, quiz review, cross-module integration.
   - *Scaffolded route:* `routes-admin.js` (`/api/admin/*`)
6. **Stage 6: Parth — Final Hardening** (`parth-hardening`)
   - Security auditing, performance tuning, and final end-to-end polish.

---

## 11. Known Limitations & Explicit Disclaimers

- **iGOT & NSSTA Integration:** In this stage, course records labeled with `sample_igot` and `sample_nssta_tpac` are sample database fixtures for schema scaffolding. There are **no live API calls, scraping, or fictitious credentials** to external government systems.
- **AI Integrations:** AI quiz generation and assistant algorithms are intentionally deferred to Stage 2 (Rucha).
- **Fictional Data Only:** All names, emails, phone numbers, and employee profiles are entirely fictional demo records. No real government personnel data is used.
- **Browser Automation Subagent Notice:** The remote Azure CDN mirror for Playwright driver binaries returned 404 during headless browser testing; complete end-to-end functionality was independently verified through the 17-case automated test suite (`npm test`) and manual server execution.

---

## 12. Git Workflow

1. Base Branch: `main`
2. Core Branch: `navbodh-core`
3. All commits follow conventional commit standards (`feat: establish NAVBODH core foundation`).
