import postgres from 'postgres';

const sql = postgres({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  database: "postgres",
  username: "postgres.tpqvmupdvxqloykqkpwj",
  password: "Owaies@2026",
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("=== RUNNING PHASE 3 DATABASE MIGRATIONS ===");

    // 1. Alter quiz table to support scheduling, lifecycle, settings, and attempts
    console.log("Adding columns to 'quiz' table...");
    await sql`
      ALTER TABLE "quiz"
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS total_marks INTEGER,
      ADD COLUMN IF NOT EXISTS passing_marks INTEGER,
      ADD COLUMN IF NOT EXISTS passing_percentage INTEGER DEFAULT 40,
      ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS show_result BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS show_correct_answers BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS leaderboard_enabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS quiz_status VARCHAR(50) DEFAULT 'LIVE'
    `;

    // 2. Alter questions table to support marks
    console.log("Adding marks column to 'questions' table...");
    await sql`
      ALTER TABLE "questions"
      ADD COLUMN IF NOT EXISTS marks INTEGER DEFAULT 1
    `;

    // 3. Create quiz_attempt table
    console.log("Creating 'quiz_attempt' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "quiz_attempt" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        eid TEXT REFERENCES "quiz"(eid) ON DELETE CASCADE,
        email VARCHAR(255) REFERENCES "user"(email) ON DELETE CASCADE,
        attempt_number INTEGER NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        submitted_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL, -- 'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED'
        score INTEGER DEFAULT 0,
        sahi INTEGER DEFAULT 0,
        wrong INTEGER DEFAULT 0,
        time_taken INTEGER DEFAULT 0, -- in seconds
        answers JSONB DEFAULT '{}'::jsonb,
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 4. Create institution_setting table
    console.log("Creating 'institution_setting' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "institution_setting" (
        institution_id TEXT PRIMARY KEY REFERENCES "institution"(id) ON DELETE CASCADE,
        timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
        leaderboard_enabled BOOLEAN DEFAULT TRUE,
        leaderboard_level_exam BOOLEAN DEFAULT TRUE,
        leaderboard_level_subject BOOLEAN DEFAULT TRUE,
        leaderboard_level_section BOOLEAN DEFAULT TRUE,
        leaderboard_level_unit BOOLEAN DEFAULT TRUE,
        student_visibility VARCHAR(50) DEFAULT 'FULL_LEADERBOARD', -- 'FULL_LEADERBOARD', 'TOP_N', 'OWN_RANK_ONLY', 'HIDDEN'
        top_n_count INTEGER DEFAULT 10,
        min_qualifying_exams INTEGER DEFAULT 3,
        multiple_attempts_rule VARCHAR(50) DEFAULT 'BEST_ATTEMPT' -- 'BEST_ATTEMPT', 'FIRST_ATTEMPT', 'LATEST_ATTEMPT'
      )
    `;

    // 5. Indexes for fast query resolution
    console.log("Creating database indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_quiz_attempt_eid_email ON "quiz_attempt" (eid, email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quiz_attempt_inst_status ON "quiz_attempt" (institution_id, status)`;

    // 6. Pre-populate settings for existing demo-institute
    console.log("Populating settings for demo-institute...");
    await sql`
      INSERT INTO "institution_setting" (institution_id, timezone, leaderboard_enabled, student_visibility)
      VALUES ('demo-institute', 'Asia/Kolkata', TRUE, 'FULL_LEADERBOARD')
      ON CONFLICT (institution_id) DO NOTHING
    `;

    // 7. Sync existing historical results from "history" table to "quiz_attempt" table
    console.log("Syncing historical history data to quiz_attempt...");
    const histories = await sql`
      SELECT h.email, h.eid, h.score, h.sahi, h.wrong, h.date, u.institution_id
      FROM "history" h
      JOIN "user" u ON h.email = u.email
    `;
    
    for (const h of histories) {
      const attemptId = 'hist-att-' + Math.random().toString(36).substring(2, 9);
      await sql`
        INSERT INTO "quiz_attempt" (id, institution_id, eid, email, attempt_number, started_at, submitted_at, status, score, sahi, wrong, time_taken)
        VALUES (${attemptId}, ${h.institution_id}, ${h.eid}, ${h.email}, 1, ${h.date}, ${h.date}, 'SUBMITTED', ${h.score}, ${h.sahi}, ${h.wrong}, 0)
        ON CONFLICT DO NOTHING
      `;
    }

    console.log("PHASE 3 DATABASE MIGRATIONS COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
