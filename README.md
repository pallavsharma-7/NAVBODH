# NAVBODH (नवबोध)
### Personalized Skill Intelligence & Learning Platform for India's Official Statistical System

> **Stage 5: Admin + Integration** | Smart India Hackathon 2026
> **Repository:** [pallavsharma-7/NAVBODH](https://github.com/pallavsharma-7/NAVBODH)
> **Current Branch:** `palak-admin-integration`
> **Predecessor Branch:** `pallav-gamification` (Commit `e86e184`)
> **Contributor (Admin + Integration):** Palak

---

## 1. Executive Overview & Problem Statement

The **National Statistical System (NSS)** of India—comprising the Ministry of Statistics and Programme Implementation (MoSPI), the National Statistical Systems Training Academy (NSSTA), and State Directorates of Economics and Statistics (DES)—relies on specialized human capital across statistical methodology, data processing, national accounts, survey sampling, and digital governance.

### Core Problem
Statistical officers across diverse divisions (NAD, SDRD, FOD, ESD, DIID, NSSTA) enter with varied competencies. Without structured skill-gap analysis, training assignments are uniform rather than tailored, leading to training inefficiencies and skill mismatches.

### NAVBODH Solution Architecture
**NAVBODH** establishes a closed-loop skill intelligence and learning ecosystem:
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
Interactive Course Catalog, Syllabi & Lesson Delivery (Stage 3: Pathika - DONE)
      ↓
Persistent Learning Progress & Lesson Completion (Stage 3: Pathika - DONE)
      ↓
Anti-Cheating Quizzes & Server-Side Scoring Engine (Stage 3: Pathika - DONE)
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
$$\text{Course Progress \%} = \frac{\text{Completed Lessons in Course}}{\text{Total Lessons in Course}} \times 100$$

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

## 3. Stage 3: Learning Module Architecture

Stage 3 transforms NAVBODH's foundation and Intelligence recommendations into an interactive, persistent learning and knowledge verification experience for statistical officers:

### 1. Course Catalog & Syllabus Details
- **Catalog Navigation:** Authenticated employees browse all available courses across statistical, technical, domain, and administrative competencies.
- **Enriched Metadata:** Exposes duration, difficulty level, attached competencies, lesson count, and live officer completion percentage.
- **Curriculum Hierarchy:** `GET /api/courses/:id` delivers complete course syllabus, ordered lessons with sequential indexing, attached official learning materials, and associated evaluation quiz.

### 2. Lesson Reader & Official Learning Materials
- **Structured Content Delivery:** `GET /api/lessons/:id` returns formatted, pedagogical lesson content, estimated read times, and previous/next navigation links.
- **Official References:** Attached `learning_materials` display official NSSTA and MoSPI documentation, circulars, and study notes with explicit source labels.
- **Session-Based Isolation:** Lesson completion state is strictly queried per authenticated session (`req.user.id`).

### 3. Persistent SQLite Lesson Completion & Progress Engine
- **Idempotent Completion:** `POST /api/lessons/:id/complete` records completion into `lesson_completions`. Repeated clicks safely return current state without corrupting or duplicating records.
- **Deterministic Course Progress:** Automatically derives course progress percentage as $(\text{completed\_lessons} / \text{total\_lessons}) \times 100$.
- **Database Persistence:** Progress is stored in `learning_progress` in SQLite, surviving page refreshes, logouts, and server restarts.
- **Strict Baseline Immutability:** Learning progress and lesson completion never modify or recalculate `employee_competencies.baseline_score`.

### 4. Anti-Cheating Knowledge Verification Quizzes
- **Secure Question Retrieval:** `GET /api/quizzes/:id` delivers quiz questions and option choices while strictly omitting correct option keys and explanations to prevent frontend inspection or cheating.
- **Server-Side Scoring Engine:** `POST /api/quizzes/:id/submit` calculates scores entirely on the backend from stored questions. Client-supplied scores or correctness flags are never trusted.
- **Comprehensive Results:** Upon submission, the engine persists attempt history in `quiz_attempts` with full answer-level diagnostics and returns percentage score, pass/fail status (passing threshold: 70%), and detailed question explanations.

### 5. Intelligence $\to$ Learning Integration
- **Seamless Flow:** Recommended courses in the Intelligence dashboard (`GET /api/intelligence/recommendations`) and roadmap milestones (`GET /api/intelligence/roadmap`) link directly to Course Details via `viewCourseDetail(courseId)`.
- **Zero Duplication:** Reuses existing course catalog and recommendation mapping without inventing fake or detached course models.

---

## 4. Technology Stack

- **Frontend:** HTML5, Vanilla JavaScript (Modular ES6), Vanilla CSS (NAVBODH Design System Token Architecture with Google Font `Audiowide`, paper/ink government theme `#F4EFE6` / `#202522`, forest green `#315343`, sage `#738678`, ochre `#B78132`, block borders, subtle offset shadows, and pixel badges).
- **Backend:** Node.js (v24.x / v26.x), Express.js (v4.21.x REST API).
- **Database:** SQLite (Relational engine with dual-mode support: `better-sqlite3` native bindings and zero-dependency `node:sqlite` fallback for full forward compatibility).
- **Security:** Server-side cryptographic sessions (`crypto.randomBytes`), `HttpOnly` cookies, parameterized SQL queries, strict session-based employee data isolation, anti-cheating quiz response masking.

---

## 5. Directory Structure

```
NAVBODH/
├── package.json               # NPM scripts, test commands, dependencies
├── server.js                  # Express server assembly and route mounting
├── db.js                      # Relational SQLite schema with dual-engine fallback & Stage 3 tables
├── seed.js                    # Seeder for demo users, competencies, questions, courses, lessons & quizzes
├── .gitignore                 # Exclusion rules (node_modules, .env, *.sqlite)
├── README.md                  # Comprehensive platform documentation
│
├── middleware/
│   └── auth.js                # Server session manager, HttpOnly cookie handler, RBAC
│
├── routes-auth.js             # Authentication endpoints (/api/auth/login, logout, me)
├── routes-core.js             # Core endpoints (/api/health, profile, competencies, assessment)
├── routes-intelligence.js     # [Stage 2: Rucha] Skill-gaps, recommendations, roadmap, study-assistant
├── routes-learning.js         # [Stage 3: Pathika] Course catalog, lessons, completion & quizzes
├── routes-gamification.js     # [Stage 4: Pallav] Safe route boundary for leaderboard & rewards
├── routes-admin.js            # [Stage 5: Palak] Core admin boundary & overview metrics
│
├── public/                    # Frontend Single Page Application (SPA)
│   ├── index.html             # Application shell, navigation, Intelligence & Stage 3 Learning views
│   ├── styles.css             # NAVBODH design tokens, palettes, Intelligence & Learning UI styles
│   ├── api.js                 # Reusable HTTP client wrapper with API.intelligence & API.learning methods
│   ├── employee.js            # Employee portal controller (Dashboard, Intelligence, Courses, Lessons, Quizzes)
│   └── admin.js               # Administrator dashboard controller
│
└── test/
    ├── test-core.js           # Core Foundation automated test suite (17 test cases)
    ├── test-intelligence.js   # Stage 2 Intelligence automated test suite (10 test cases)
    ├── test-learning.js       # Stage 3 Learning automated test suite (13 test cases)
    └── test-frontend-integration.js # Full-stack client lifecycle simulation (12 test cases)
```

---

## 6. Working API Endpoints

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

### Intelligence Engine Endpoints (Stage 2)
| Method | Endpoint | Auth Required | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/intelligence/skill-gaps` | Yes | Employee | Deterministic skill-gap identification and prioritization |
| `GET` | `/api/intelligence/recommendations` | Yes | Employee | Personalized course recommendations mapped to active gaps |
| `GET` | `/api/intelligence/roadmap` | Yes | Employee | Dynamic, phased learning roadmap with milestone progression |
| `POST` | `/api/intelligence/study-assistant` | Yes | Employee | AI study assistant boundary with grounded deterministic fallback |

### Learning Module Endpoints (Stage 3 - Implemented)
| Method | Endpoint | Auth Required | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | Yes | Employee | Course catalog with attached competencies & progress |
| `GET` | `/api/courses/:id` | Yes | Employee | Full course syllabus, ordered lessons, materials & quiz |
| `GET` | `/api/courses/:id/lessons` | Yes | Employee | List ordered lessons belonging to course |
| `GET` | `/api/lessons/:id` | Yes | Employee | Structured lesson reader, materials & navigation |
| `POST` | `/api/lessons/:id/complete` | Yes | Employee | Mark lesson complete & derive persistent course progress |
| `GET` | `/api/quizzes` | Yes | Employee | List knowledge verification quizzes with attempt history |
| `GET` | `/api/quizzes/:id` | Yes | Employee | Fetch quiz questions (correct answers hidden) |
| `POST` | `/api/quizzes/:id/submit` | Yes | Employee | Server-side scoring, attempt persistence & result review |

---

## 7. Example Stage 3 API Payloads

### `GET /api/courses/1`
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 1,
      "code": "CRS_STAT_101",
      "title": "National Accounts & GDP Compilation Methodology",
      "description": "Comprehensive training on SUT tables, GVA estimation, and base-year revisions according to SNA 2008 standards.",
      "durationHours": 18,
      "difficultyLevel": "intermediate",
      "source": "sample_nssta_tpac",
      "sourceDisplayName": "Sample NSSTA Training Calendar (Demo)",
      "competencies": [
        { "id": 1, "code": "STAT_SNA", "name": "System of National Accounts (SNA)" }
      ],
      "lessonsCount": 3,
      "completedLessonsCount": 1,
      "progressPercentage": 33.3,
      "lessons": [
        {
          "id": 1,
          "title": "Introduction to SNA 2008 & GDP Framework",
          "orderNum": 1,
          "durationMinutes": 45,
          "isCompleted": true,
          "completedAt": "2026-09-21T15:10:00.000Z",
          "materialsCount": 2
        }
      ],
      "quiz": {
        "id": 1,
        "title": "National Accounts Methodology Assessment Quiz",
        "questionsCount": 3,
        "latestAttempt": null
      }
    }
  }
}
```

### `POST /api/lessons/1/complete`
```json
{
  "success": true,
  "data": {
    "lessonId": 1,
    "courseId": 1,
    "isCompleted": true,
    "alreadyCompleted": false,
    "progress": {
      "courseId": 1,
      "completedLessons": 1,
      "totalLessons": 3,
      "progressPercentage": 33.3,
      "status": "in_progress"
    }
  }
}
```

### `POST /api/quizzes/1/submit`
**Request:**
```json
{
  "answers": [
    { "questionId": 1, "selectedOptionIndex": 1 },
    { "questionId": 2, "selectedOptionIndex": 1 },
    { "questionId": 3, "selectedOptionIndex": 1 }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": 1,
    "quizId": 1,
    "title": "National Accounts Methodology Assessment Quiz",
    "score": 100,
    "passed": true,
    "correctCount": 3,
    "totalQuestions": 3,
    "passingScore": 70,
    "results": [
      {
        "questionId": 1,
        "questionText": "Under SNA 2008, what is the relationship between Gross Value Added (GVA) at basic prices and GDP at market prices?",
        "options": ["...", "GDP = GVA at basic prices + Product taxes - Product subsidies", "..."],
        "selectedOptionIndex": 1,
        "correctOptionIndex": 1,
        "isCorrect": true,
        "explanation": "GDP at market prices equals GVA at basic prices plus product taxes less product subsidies."
      }
    ]
  }
}
```

---

## 4. Stage 4: Gamification Module Architecture

Stage 4 introduces a persistent, baseline-aware, explainable **Gamification & Reward Ledger Engine** that rewards genuine learning progress and competency improvement without altering Core baseline immutability:

### 1. Reward Event System & Ledger
- **Persistent Event Ledger:** Uses `reward_ledger` with `event_key TEXT UNIQUE` to guarantee DB-level duplicate reward protection.
- **Deterministic Point Values:**
  - **Baseline Assessment Submission:** +50 points (`assessment_completed`)
  - **Subsequent Assessment Submission:** +30 points (`assessment_completed`)
  - **Lesson Completed:** +15 points (`lesson_completed`)
  - **Quiz Passed (score $\ge 70\%$):** +25 points (`quiz_completed`)
  - **Quiz Perfect Score ($100\%$):** +15 bonus points (`quiz_perfect_score`)
  - **Growth Milestones:** 10% (+40 pts), 20% (+60 pts), 35% (+80 pts), 50% (+100 pts)
  - **Achievement Unlock:** +25 points (`achievement_awarded`)
  - **Learning Streak Milestones:** 3-Day (+30 pts), 7-Day (+70 pts)
- **Duplicate Protection:** API refreshes, repeated quiz submissions, or re-completing lessons use `INSERT OR IGNORE` with unique event keys (e.g. `lesson_<id>`, `quiz_attempt_<id>`, `milestone_10`). Points are awarded **strictly once** per causal event.

### 2. Baseline-Aware Growth Calculation
- **Formula:** $\text{Growth \%} = \frac{\text{Current Score} - \text{Baseline Score}}{\text{Baseline Score}} \times 100$
- **Baseline Immutability:** `employee_competencies.baseline_score` is strictly read-only and never modified by Gamification.
- **Zero-Baseline Protection:** When $\text{Baseline Score} = 0$:
  - If $\text{Current Score} = 0$, returns `growth_percent: 0.0`, `growth_display: "0.0%"`.
  - If $\text{Current Score} > 0$, returns `growth_percent: 0.0`, `growth_display: "New Skill (+X pts)"`, `is_zero_baseline: true`.
  - Never produces `NaN`, `Infinity`, or `-Infinity`.

### 3. Achievements & Recognition
- 12 official achievements across growth, learning, streak, and domain mastery categories (`ACH_FIRST_BASELINE`, `ACH_FIRST_LESSON`, `ACH_FIRST_QUIZ`, `ACH_COURSE_COMPLETE`, `ACH_STREAK_3`, `ACH_STREAK_7`, `ACH_GROWTH_10PCT`, `ACH_GROWTH_20PCT`, `ACH_GROWTH_35PCT`, `ACH_GROWTH_50PCT`, `ACH_STAT_PIONEER`, `ACH_DIGITAL_CHAMPION`).
- Unlocked achievements persist in `employee_achievements` with `UNIQUE(user_id, achievement_id)` constraint.

### 4. Learning Streak Engine
- Analyzes distinct activity calendar dates (`YYYY-MM-DD`) from `lesson_completions.completed_at`, `quiz_attempts.attempted_at`, and `assessment_attempts.completed_at`.
- Calculates current active streak and longest historical streak. Page refreshes do not inflate streak counters.

### 5. Deterministic Growth Leaderboard
- **Primary Rank Metric:** Growth %
- **Tie-Breaker 1:** Total Points Earned
- **Tie-Breaker 2:** Meaningful Completions Count (Lessons + Passed Quizzes)
- **Tie-Breaker 3:** Employee ID ASC (Stable deterministic ordering with zero randomness)

---

---

## 5. Stage 5: Admin + Integration Module Architecture

Stage 5 completes the enterprise administrative governance and cross-module system integration for NAVBODH:

### 1. Executive Admin Dashboard (`GET /api/admin/overview`)
- **Server-Side Authorization:** Strictly protected by `requireAuth` and `requireRole('admin')`. Returns HTTP 403 Forbidden for non-admin users.
- **Real Aggregate Database Metrics:**
  - Total users, employees, and administrators breakdown
  - Active learners count (officers with assessments, lessons, or quizzes)
  - Division-wise employee count, assessed count, and average scores
  - 4-Domain competency health benchmarks (Statistical, Technical, Digital Governance, Behavioural)
  - Top identified workforce skill gaps (highest competency deficit vs 80% target)
  - Assessment attempts distribution (baseline vs subsequent, average score)
  - Course enrollments, lesson completions, and quiz pass rates
  - Reward ledger points distributed and unlocked achievements

### 2. Officer Roster & Skill Inventory (`GET /api/admin/employees`)
- **Safe Employee Profiles:** Excludes all passwords, password hashes, session tokens, and secrets.
- **Consolidated Officer Metrics:**
  - Competency evaluation counts, baseline average, current average, and growth %
  - Assessment history (total attempts, latest score, last assessed timestamp)
  - Learning progress (enrolled courses, completed courses, lessons completed)
  - Quiz performance (quizzes attempted, quizzes passed, average score)
  - Gamification points and unlocked badges
  - Detailed 17-benchmark competency score matrix accessible via inspection drawer without employee impersonation
- **Safe Filtering:** Supports `department_id` and keyword search without privilege escalation.

### 3. Learning Content & Curriculum Management (`GET /api/admin/content`)
- Comprehensive overview of all 6 curated statistical courses across iGOT, NSSTA, and Local catalogs.
- Attached lesson curriculum syllabi, duration, and reference materials.
- Mapped competencies with growth impact scores.
- Associated evaluation quizzes, pass benchmarks, and question banks.

### 4. Truthful System Integration Status (`GET /api/integrations/status`)
- Clearly distinguishes simulated demonstration adapters from live operational storage:
  - **AI Intelligence Assistant:** `simulated` / `rules_based_fallback` (Local Deterministic Intelligence Engine)
  - **iGOT-Karmayogi Platform:** `simulated` / `demo_catalog` (3 sample civil service modules)
  - **NSSTA TPAC Academy:** `simulated` / `demo_curriculum` (2 sample specialized statistical modules)
  - **SQLite Database Storage:** `operational` / `wal_journal` (Active embedded relational storage)
  - **Gamification Reward Ledger:** `operational` / `immutable_ledger` (Idempotent event-keyed ledger)

---

## 8. Demo Credentials

| Username | Password | Role | Name | Department / Cadre |
| :--- | :--- | :--- | :--- | :--- |
| `emp.sharma` | `Password123!` | `employee` | Priya Sharma | National Accounts Division (SSS) |
| `emp.verma` | `Password123!` | `employee` | Rajesh Verma | Survey Design & Research Division (ISS) |
| `admin.navbodh` | `AdminPass123!` | `admin` | Dr. Anil Kumar | NSSTA Training Director / Admin |

---

## 9. Installation & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Complete Test Suite
```bash
npm test
```
*Executes all 93 automated tests across `test-core.js` (17 tests), `test-intelligence.js` (10 tests), `test-learning.js` (13 tests), `test-gamification.js` (17 tests), `test-frontend-integration.js` (16 tests), and `test-admin.js` (20 tests).*

Individual test suites can be executed via:
```bash
npm run test:core
npm run test:intelligence
npm run test:learning
npm run test:gamification
npm run test:frontend
npm run test:admin
```

### 3. Run Application
```bash
npm start
```
Access the application at: **`http://localhost:3000`**

---

## 10. Known Limitations & Explicit Disclaimers

1. **Course Catalog Demo Labels:** Courses marked with `sample_nssta_tpac`, `sample_igot`, and `local_demo` represent sample training fixtures. External API adapters operate in simulated demonstration mode in accordance with Stage 5 specifications.
2. **Server-Side Authorization & Scoring:** All admin data, quiz scoring, and gamification calculations are strictly verified server-side.
3. **Immutability of Baseline:** Baseline competency scores (`baseline_score`) remain permanent and unchanged throughout all stages.

---

## 11. Information for Next Contributor (Stage 6: Parth)

- **Next Stage:** Stage 6 — Final Hardening (`parth-hardening`)
- **Starting Branch:** Branch off from `palak-admin-integration`
- **Ownership:** Final production readiness, security penetration audit, performance optimization, and containerization.
- **Rule of Immutability:** Preserve Core, Intelligence, Learning, Gamification, and Admin contracts without breaking accepted functionality.
