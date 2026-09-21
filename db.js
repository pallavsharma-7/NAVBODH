let Database;
try {
  Database = require('better-sqlite3');
  // Test constructor to ensure native binary bindings exist
  new Database(':memory:').close();
} catch (e) {
  // If better-sqlite3 native addon is not available (e.g. Node 25+ environments where prebuilt binaries are not available),
  // transparently use Node's built-in node:sqlite with identical API parity.
  const { DatabaseSync } = require('node:sqlite');
  Database = class BetterSqlite3Compat {
    constructor(filePath) {
      this._db = new DatabaseSync(filePath);
    }
    exec(sql) {
      return this._db.exec(sql);
    }
    prepare(sql) {
      const stmt = this._db.prepare(sql);
      return {
        run: (...args) => {
          const res = stmt.run(...args);
          return {
            changes: Number(res.changes || 0),
            lastInsertRowid: Number(res.lastInsertRowid || 0)
          };
        },
        get: (...args) => stmt.get(...args),
        all: (...args) => stmt.all(...args)
      };
    }
    pragma(sql) {
      return this._db.exec(`PRAGMA ${sql}`);
    }
    transaction(fn) {
      return (...args) => {
        this._db.exec('BEGIN');
        try {
          const res = fn(...args);
          this._db.exec('COMMIT');
          return res;
        } catch (err) {
          this._db.exec('ROLLBACK');
          throw err;
        }
      };
    }
    close() {
      return this._db.close();
    }
  };
}

const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'navbodh.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const database = getDb();

  database.exec(`
    -- 1. Departments Table
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'admin')),
      full_name TEXT NOT NULL,
      designation TEXT,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      cadre TEXT,
      phone TEXT,
      bio TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Competencies Table
    CREATE TABLE IF NOT EXISTS competencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL CHECK(domain IN ('Statistical', 'Technical', 'Digital Governance', 'Behavioural / Managerial')),
      description TEXT,
      target_score REAL DEFAULT 80.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Employee Competencies Table (Growth & Baseline foundation)
    CREATE TABLE IF NOT EXISTS employee_competencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      competency_id INTEGER NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
      baseline_score REAL DEFAULT 0.0,
      current_score REAL DEFAULT 0.0,
      target_score REAL DEFAULT 80.0,
      last_assessed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, competency_id)
    );

    -- 5. Assessments Table
    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'initial_baseline' CHECK(type IN ('initial_baseline', 'periodic_review', 'domain_specific')),
      is_active INTEGER DEFAULT 1,
      total_questions INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Assessment Questions Table
    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      competency_id INTEGER NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'intermediate' CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Assessment Attempts Table
    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL REFERENCES assessments(id),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      is_baseline INTEGER NOT NULL DEFAULT 0,
      overall_score REAL NOT NULL DEFAULT 0.0,
      details_json TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Courses Table (Future Learning Foundation)
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      source_label TEXT NOT NULL CHECK(source_label IN ('sample_igot', 'sample_nssta_tpac', 'local_demo')),
      duration_hours REAL DEFAULT 0.0,
      difficulty_level TEXT DEFAULT 'intermediate',
      domain TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Course Competencies Mapping Table
    CREATE TABLE IF NOT EXISTS course_competencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      competency_id INTEGER NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
      growth_impact_score REAL DEFAULT 10.0,
      UNIQUE(course_id, competency_id)
    );

    -- 10. Lessons Table
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      sequence_order INTEGER NOT NULL DEFAULT 1,
      content_summary TEXT,
      duration_minutes INTEGER DEFAULT 15,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id, sequence_order)
    );

    -- 11. Learning Materials Table
    CREATE TABLE IF NOT EXISTS learning_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      material_type TEXT CHECK(material_type IN ('document', 'video', 'dataset', 'reference_manual', 'guideline')),
      file_url_or_ref TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(lesson_id, title)
    );

    -- 12. Learning Progress Table
    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled', 'in_progress', 'completed')),
      progress_percent REAL DEFAULT 0.0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id)
    );

    -- 13. Quizzes Table
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      competency_id INTEGER REFERENCES competencies(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      pass_percentage REAL DEFAULT 70.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(course_id)
    );

    -- 13b. Quiz Questions Table (Stage 3 Learning Knowledge Checks)
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT,
      sequence_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(quiz_id, sequence_order)
    );

    -- 14. Quiz Attempts Table
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score REAL NOT NULL,
      passed INTEGER NOT NULL DEFAULT 0,
      details_json TEXT,
      attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14b. Lesson Completions Table (Stage 3 Persistent Lesson Completion Tracking)
    CREATE TABLE IF NOT EXISTS lesson_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, lesson_id)
    );

    -- 15. Reward Ledger Table (Gamification Foundation)
    CREATE TABLE IF NOT EXISTS reward_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      event_key TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Achievement Definitions Table
    CREATE TABLE IF NOT EXISTS achievement_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT DEFAULT 'trophy',
      category TEXT DEFAULT 'growth',
      threshold_criteria_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 17. Employee Achievements Table
    CREATE TABLE IF NOT EXISTS employee_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    );

    -- 18. Server-Side Sessions Table
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for common lookups
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_emp_comp_user_id ON employee_competencies(user_id);
    CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON assessment_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON assessment_questions(assessment_id);
    CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_lesson ON lesson_completions(user_id, lesson_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
    CREATE INDEX IF NOT EXISTS idx_learning_progress_user_course ON learning_progress(user_id, course_id);
    CREATE INDEX IF NOT EXISTS idx_reward_ledger_user_id ON reward_ledger(user_id);
    CREATE INDEX IF NOT EXISTS idx_reward_ledger_event_key ON reward_ledger(event_key);
  `);

  // Ensure event_key column exists if database was created with earlier schema version
  try {
    const tableInfo = database.prepare("PRAGMA table_info(reward_ledger)").all();
    const hasEventKey = tableInfo.some(col => col.name === 'event_key');
    if (!hasEventKey) {
      database.exec("ALTER TABLE reward_ledger ADD COLUMN event_key TEXT;");
      database.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_ledger_event_key ON reward_ledger(event_key);");
    }
  } catch (e) {
    // Ignore migration error if already exists
  }

  return database;
}

module.exports = {
  getDb,
  initDatabase,
  Database
};
