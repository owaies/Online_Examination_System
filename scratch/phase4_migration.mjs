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
    console.log("=== RUNNING PHASE 4 DATABASE MIGRATIONS ===");

    // 1. Create topic table
    console.log("Creating 'topic' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "topic" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        subject_id TEXT REFERENCES "subject"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_id TEXT REFERENCES "topic"(id) ON DELETE SET NULL
      )
    `;

    // 2. Create question_pool table
    console.log("Creating 'question_pool' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "question_pool" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        subject_id TEXT REFERENCES "subject"(id) ON DELETE CASCADE,
        created_by VARCHAR(255) NOT NULL
      )
    `;

    // 3. Alter questions table to make eid nullable and add advanced metadata
    console.log("Adding columns to 'questions' table...");
    await sql`
      ALTER TABLE "questions" ALTER COLUMN eid DROP NOT NULL;
    `;
    await sql`
      ALTER TABLE "questions" ADD CONSTRAINT uq_questions_qid UNIQUE (qid);
    `.catch(e => console.log("Constraint uq_questions_qid might already exist:", e.message));
    await sql`
      ALTER TABLE "questions"
      ADD COLUMN IF NOT EXISTS institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS creator_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS topic_id TEXT REFERENCES "topic"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'UNSPECIFIED',
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS explanation TEXT,
      ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS sharing VARCHAR(50) DEFAULT 'PRIVATE'
    `;

    // 4. Create pool_question table
    console.log("Creating 'pool_question' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "pool_question" (
        pool_id TEXT REFERENCES "question_pool"(id) ON DELETE CASCADE,
        qid TEXT REFERENCES "questions"(qid) ON DELETE CASCADE,
        PRIMARY KEY (pool_id, qid)
      )
    `;

    // 5. Create exam_blueprint table
    console.log("Creating 'exam_blueprint' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "exam_blueprint" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        subject_id TEXT REFERENCES "subject"(id) ON DELETE CASCADE,
        created_by VARCHAR(255) NOT NULL,
        rules JSONB DEFAULT '{}'::jsonb
      )
    `;

    // 6. Create import_history table
    console.log("Creating 'import_history' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "import_history" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        imported_by VARCHAR(255) NOT NULL,
        imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        file_name VARCHAR(255) NOT NULL,
        row_count INTEGER DEFAULT 0,
        import_type VARCHAR(50) NOT NULL
      )
    `;

    // 7. Alter quiz table to support dynamic pool-based configurations
    console.log("Adding columns to 'quiz' table...");
    await sql`
      ALTER TABLE "quiz"
      ADD COLUMN IF NOT EXISTS selection_mode VARCHAR(50) DEFAULT 'SAME_SET_FOR_ALL',
      ADD COLUMN IF NOT EXISTS pool_id TEXT REFERENCES "question_pool"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS blueprint_id TEXT REFERENCES "exam_blueprint"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS question_order JSONB DEFAULT '[]'::jsonb
    `;

    // 8. Alter quiz_attempt table to support snapshotted student question set
    console.log("Adding question_set column to 'quiz_attempt' table...");
    await sql`
      ALTER TABLE "quiz_attempt"
      ADD COLUMN IF NOT EXISTS question_set JSONB
    `;

    // 9. Backfill institution_id and creator_id for existing questions
    console.log("Backfilling existing questions with creator and tenant contexts...");
    await sql`
      UPDATE "questions" q
      SET institution_id = qz.institution_id, creator_id = qz.email
      FROM "quiz" qz
      WHERE q.eid = qz.eid AND q.institution_id IS NULL
    `;

    // 10. Add indexes
    console.log("Creating database indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_questions_inst_creator ON "questions" (institution_id, creator_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_questions_subject_topic ON "questions" (subject_id, topic_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_questions_status_difficulty ON "questions" (status, difficulty)`;

    console.log("PHASE 4 DATABASE MIGRATIONS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
