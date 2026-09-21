# NAVBODH (नवबोध)
### Personalized Skill Intelligence & Learning Platform for India's Official Statistical System

> **Stage 2: Intelligence** | Smart India Hackathon 2026  
> **Repository:** [pallavsharma-7/NAVBODH](https://github.com/pallavsharma-7/NAVBODH)  
> **Current Branch:** `rucha-intelligence`  
> **Predecessor Branch:** `navbodh-core` (Commit `bd4aae1`)  
> **Contributor (Intelligence):** Rucha  

---

## 1. Executive Overview & Problem Statement

The **National Statistical System (NSS)** of India—comprising the Ministry of Statistics and Programme Implementation (MoSPI), the National Statistical Systems Training Academy (NSSTA), and State Directorates of Economics and Statistics (DES)—relies on specialized human capital across statistical methodology, data processing, national accounts, survey sampling, and digital governance.

### Core Problem
Statistical officers across diverse divisions (NAD, SDRD, FOD, ESD, DIID, NSSTA) enter with varied competencies. Without structured skill-gap analysis, training assignments are uniform rather than tailored, leading to training inefficiencies and skill mismatches.

### NAVBODH Solution Architecture
**NAVBODH** establishes a closed-loop skill intelligence ecosystem:
```
Employee Profile & Cadre Data (Stage 1: Tanishka - DONE)
      ↓
Competency Baseline & Periodic Assessment (Stage 1: Tanishka - DONE)
      ↓
Skill-Gap Identification & Prioritization Engine (Stage 2: Rucha - DONE)
      ↓
Personalized Course Recommendation Engine (Stage 2: Rucha - DONE)
      ↓
Dynamic Phased Learning Roadmap (Stage 2: Rucha - DONE)
      ↓
Intelligent Study Assistant Boundary (Stage 2: Rucha - DONE)
      ↓
Interactive Course & Lesson Delivery (Stage 3: Pathika)
      ↓
Knowledge Verification Quizzes (Stage 3: Pathika)
      ↓
Growth Calculation & Gamification (Stage 4: Pallav)
      ↓
Workforce Skill Heatmaps & Admin Analytics (Stage 5: Palak)
      ↓
Final Hardening & Security Audit (Stage 6: Parth)
```

**Key Metric:** *Growth-Based Intelligence*. Individual deficiency gaps and learning progression are continuously derived against permanent baseline scores:
$$\text{Skill Gap} = \text{Target Score} - \text{Current Score} \quad (\text{if } \text{Gap} > 0)$$
$$\text{Growth \%} = \frac{\text{Current Score} - \text{Baseline Score}}{\text{Baseline Score}} \times 100$$

---

## 2. Stage 2: Intelligence Engine Architecture

Stage 2 delivers a deterministic, transparent, and explainable intelligence layer that consumes the Core Foundation schema without altering baseline immutability:

### 1. Skill-Gap Identification & Prioritization
- **Gap Formula:** For each competency, $\text{Gap} = \text{Target Score} - \text{Current Score}$.
- **Active Deficiency Condition:** If $\text{Gap} > 0$, the competency is classified as an active skill gap. If $\text{Gap} \le 0$, the benchmark is achieved ($\text{Gap} = 0$, status: `met`).
- **Centralized Priority Thresholds:**
  - **High Priority Deficiency:** $\text{Gap} \ge 30.0$ points (substantial deficiency requiring immediate training intervention).
  - **Medium Priority Deficiency:** $15.0 \le \text{Gap} < 30.0$ points (moderate deficiency for core enhancement).
  - **Low Priority Deficiency:** $0.0 < \text{Gap} < 15.0$ points (refinement towards official benchmark).
  - **Benchmark Met:** $\text{Gap} \le 0.0$ points (no active deficiency).

### 2. Personalized Course Recommendation Engine
- **Relationship:** Authenticated Employee Active Skill Gaps $\to$ Competencies $\to$ `course_competencies` $\to$ `courses`.
- **Multi-Gap Aggregation:** Identifies courses that resolve multiple active deficiencies for the officer.
- **Explainable Selection Reason:** Generates transparent rationale for every recommendation (e.g., *"This course directly addresses your high-priority SQL competency gap (25.0 pts below target) with an estimated +25.0 pt growth impact."*).
- **Deterministic Ranking Score:** Courses are ranked by relevance score based on weighted gap severity ($\text{High} \times 3.0 + \text{Medium} \times 2.0 + \text{Low} \times 1.0$) and course growth impact. Duplicate courses are eliminated.
- **Source Label Integrity:** Sample catalogs are explicitly demarcated as demo content (`sample_igot`, `sample_nssta_tpac`, `local_demo`).

### 3. Dynamic Learning Roadmap Generator
- **Phased Milestones:** Automatically organizes learning into progressive stages:
  - **Phase 1: Urgent Skill Remediation** (High priority gaps $\ge 30$ pts).
  - **Phase 2: Core Skill Building & Enhancement** (Medium priority gaps 15–29.9 pts).
  - **Phase 3: Competency Alignment & Refinement** (Low priority gaps $< 15$ pts).
  - **Phase 4: Target Mastery & Maintenance** (Competencies meeting target).
- **Real-Time Adaptivity:** Roadmap is derived dynamically from current database records. When an officer retakes an assessment and improves their scores, the roadmap updates immediately.
- **Milestone Enrichment:** Each milestone includes consecutive sequence numbering, current vs target scores, domain tags, pedagogical focus recommendations, and attached courses.

### 4. AI Study Assistant Integration Boundary
- **Input Validation:** Rejects empty or malformed queries with standard HTTP 400 error contracts.
- **Context Grounding:** Analyzes officer inquiries using their authenticated profile, division (e.g. NAD, SDRD), active skill gaps, and roadmap milestones from the backend database.
- **Safe Deterministic Fallback:** Functions reliably without external API keys. Provides explainable, structured study recommendations with zero simulated/fake LLM claims.
- **Provider-Independent Boundary:** If an external LLM provider is configured in `process.env.AI_API_KEY`, the backend adapter catches timeouts and network errors gracefully, ensuring backend secrets are never exposed to the frontend.

---

## 3. Technology Stack

- **Frontend:** HTML5, Vanilla JavaScript (Modular ES6), Vanilla CSS (NAVBODH Design System Token Architecture with Google Font `Audiowide`, paper/ink government theme, block borders, subtle offset shadows, and pixel badges).
- **Backend:** Node.js (v24.x / v25.x), Express.js (v4.21.x REST API).
- **Database:** SQLite (Relational engine with dual-mode support: `better-sqlite3` native bindings and zero-dependency `node:sqlite` fallback for full forward compatibility).
- **Security:** Server-side cryptographic sessions (`crypto.randomBytes`), `HttpOnly` cookies, parameterized SQL queries, strict session-based employee data isolation.

---

## 4. Directory Structure

```
NAVBODH/
├── package.json               # NPM scripts, test commands, dependencies
├── server.js                  # Express server assembly and route mounting
├── db.js                      # Relational SQLite schema with dual-engine fallback
├── seed.js                    # Seeder for demo users, competencies, questions & courses
├── .gitignore                 # Exclusion rules (node_modules, .env, *.sqlite)
├── README.md                  # Comprehensive platform documentation
│
├── middleware/
│   └── auth.js                # Server session manager, HttpOnly cookie handler, RBAC
│
├── routes-auth.js             # Authentication endpoints (/api/auth/login, logout, me)
├── routes-core.js             # Core endpoints (/api/health, profile, competencies, assessment)
├── routes-intelligence.js     # [Stage 2: Rucha] Skill-gaps, recommendations, roadmap, study-assistant
├── routes-learning.js         # [Stage 3: Pathika] Safe route boundary for learning modules
├── routes-gamification.js     # [Stage 4: Pallav] Safe route boundary for leaderboard & rewards
├── routes-admin.js            # [Stage 5: Palak] Core admin boundary & overview metrics
│
├── public/                    # Frontend Single Page Application (SPA)
│   ├── index.html             # Application shell, navigation, and Stage 2 Intelligence views
│   ├── styles.css             # NAVBODH design tokens, palettes, and Intelligence UI styles
│   ├── api.js                 # Reusable HTTP client wrapper with API.intelligence methods
│   ├── employee.js            # Employee portal controller (Dashboard, Gaps, Recs, Roadmap, Assistant)
│   └── admin.js               # Administrator dashboard controller
│
└── test/
    ├── test-core.js           # Core Foundation automated test suite (17 test cases)
    ├── test-intelligence.js   # Stage 2 Intelligence automated test suite (10 test cases)
    └── test-frontend-integration.js # Full-stack client lifecycle simulation (9 test cases)
```

---

## 5. Working API Endpoints

### Core Foundation Endpoints (Stage 1)
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
| `POST`| `/api/assessment/submit` | Yes | Employee | Submit answers, score, establish/update baseline |
| `GET` | `/api/assessment/result` | Yes | Employee | Get latest assessment results & review |
| `GET` | `/api/admin/overview` | Yes | Admin | System statistics & audit log of assessments |

### Intelligence Engine Endpoints (Stage 2 - Implemented)
| Method | Endpoint | Auth Required | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/intelligence/skill-gaps` | Yes | Employee | Deterministic skill-gap identification and prioritization |
| `GET` | `/api/intelligence/recommendations` | Yes | Employee | Personalized course recommendations mapped to active gaps |
| `GET` | `/api/intelligence/roadmap` | Yes | Employee | Dynamic, phased learning roadmap with milestone progression |
| `POST` | `/api/intelligence/study-assistant` | Yes | Employee | AI study assistant boundary with grounded deterministic fallback |

---

## 6. Example Intelligence API Payloads

### `GET /api/intelligence/skill-gaps`
```json
{
  "success": true,
  "data": {
    "hasAssessment": true,
    "summary": {
      "totalCompetencies": 17,
      "activeGapsCount": 6,
      "highPriorityCount": 2,
      "mediumPriorityCount": 3,
      "lowPriorityCount": 1,
      "metCount": 11,
      "averageCurrentScore": 62.4,
      "averageTargetScore": 80.0,
      "domainsRepresented": ["Technical", "Statistical"],
      "largestGap": {
        "competencyId": 7,
        "competency": "SQL",
        "domain": "Technical",
        "gap": 35.0,
        "priority": "high"
      }
    },
    "gaps": [
      {
        "competencyId": 7,
        "competencyCode": "TECH_SQL",
        "competency": "SQL",
        "domain": "Technical",
        "baselineScore": 45.0,
        "currentScore": 45.0,
        "targetScore": 80.0,
        "gap": 35.0,
        "priority": "high",
        "status": "deficiency"
      }
    ]
  }
}
```

### `GET /api/intelligence/recommendations`
```json
{
  "success": true,
  "data": {
    "hasAssessment": true,
    "totalRecommendations": 3,
    "recommendations": [
      {
        "courseId": 4,
        "courseCode": "CRS_TECH_102",
        "title": "SQL for Government Data Analysts",
        "source": "sample_igot",
        "sourceDisplayName": "Sample iGOT-Karmayogi Catalog (Demo)",
        "durationHours": 14.0,
        "difficultyLevel": "beginner",
        "domain": "Technical",
        "rankingScore": 130.0,
        "matchedCompetencies": [
          {
            "competencyId": 7,
            "code": "TECH_SQL",
            "name": "SQL",
            "domain": "Technical",
            "currentScore": 45.0,
            "targetScore": 80.0,
            "gap": 35.0,
            "priority": "high",
            "growthImpact": 25.0
          }
        ],
        "reason": "This course directly addresses your high-priority SQL competency gap (35.0 pts below target) with an estimated +25.0 pt growth impact."
      }
    ]
  }
}
```

### `POST /api/intelligence/study-assistant`
**Request:**
```json
{
  "message": "What should I learn first?"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "Based on your latest competency evaluation in the **National Accounts Division**, your highest-priority focus area is **SQL** (Technical domain).\n\n• **Current Score:** 45 / Target: 80 (Deficiency Gap: 35 pts - HIGH Priority)\n• **Recommended Focus:** Master relational database querying, window functions, and enterprise statistical data extraction.\n\n**Suggested Learning Sequence:**\n1. Review the foundational concepts in SQL.\n2. Enroll in the matching course from your **Recommendations** tab.\n3. Complete practical statistical exercises on administrative data.\n4. Re-evaluate your score through the periodic assessment module.",
    "category": "priority_focus",
    "mode": "rules_based_fallback",
    "engine": "NAVBODH Explainable Intelligence Assistant (Stage 2 Demo)",
    "contextSummary": {
      "officerName": "Priya Sharma",
      "department": "National Accounts Division",
      "hasAssessment": true,
      "activeGapsCount": 6,
      "topPriorityCompetency": "SQL",
      "topPriorityGap": 35.0
    }
  }
}
```

---

## 7. Demo Credentials

| Username | Password | Role | Name | Department / Cadre |
| :--- | :--- | :--- | :--- | :--- |
| `emp.sharma` | `Password123!` | `employee` | Priya Sharma | National Accounts Division (SSS) |
| `emp.verma` | `Password123!` | `employee` | Rajesh Verma | Survey Design & Research Division (ISS) |
| `admin.navbodh` | `AdminPass123!` | `admin` | Dr. Anil Kumar | NSSTA Training Director / Admin |

---

## 8. Installation & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite (Core Foundation + Intelligence + Simulation)
```bash
npm test
```
*Executes all 27 automated tests across `test-core.js` and `test-intelligence.js`.*

### 3. Run Application
```bash
npm start
```
Access the application at: **`http://localhost:3000`**

---

## 9. Known Limitations & Explicit Disclaimers

1. **Rule-Based Intelligence vs External AI:** Stage 2 implements transparent, explainable rule-based algorithms for skill-gap calculation, prioritization, recommendation ranking, and dynamic roadmap generation. The study assistant uses an authoritative rule-based contextual engine as a safe fallback when no external AI API key is configured.
2. **Sample Catalog Source Labels:** Courses marked with `sample_igot`, `sample_nssta_tpac`, and `local_demo` represent sample training fixtures for demonstration and schema scaffolding. There are **no live connections, credentials, or scraping** of external government portals.
3. **Future Learning Modules:** Interactive lesson viewing, course enrollment progress, and quiz execution are scheduled for Stage 3 (Pathika).

---

## 10. Information for Next Contributor (Stage 3: Pathika)

- **Next Stage:** Stage 3 — Learning (`pathika-learning`)
- **Starting Branch:** Branch off from `rucha-intelligence`
- **Ownership:** Interactive course enrollment, lesson progression (`learning_progress`, `lessons`, `learning_materials`), quiz taking (`quizzes`, `quiz_attempts`), and post-lesson score advancement.
- **APIs to Consume:** Consume `GET /api/intelligence/recommendations` and `GET /api/intelligence/roadmap` to link recommended courses directly into the enrollment workflow.
- **Rule of Immutability:** Preserve `baseline_score` immutability in `employee_competencies` while updating `current_score`.
