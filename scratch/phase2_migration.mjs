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
    console.log("=== RUNNING PHASE 2 DATABASE MIGRATIONS ===");

    // 1. Academic Year table
    console.log("Creating 'academic_year' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "academic_year" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_institution_year_name UNIQUE (institution_id, name)
      )
    `;

    // 2. Academic Unit table (self-referencing parent/child)
    console.log("Creating 'academic_unit' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "academic_unit" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE CASCADE,
        parent_id TEXT REFERENCES "academic_unit"(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'CLASS', 'GRADE', 'PROGRAM', 'DEPARTMENT', 'STREAM', 'YEAR', 'SEMESTER', 'BATCH', 'OTHER'
        display_order INTEGER DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 3. Section table
    console.log("Creating 'section' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "section" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE CASCADE,
        academic_unit_id TEXT REFERENCES "academic_unit"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_inst_year_unit_section UNIQUE (institution_id, academic_year_id, academic_unit_id, name)
      )
    `;

    // 4. Subject table
    console.log("Creating 'subject' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "subject" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100),
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_inst_year_subject_name UNIQUE (institution_id, academic_year_id, name)
      )
    `;

    // 5. Academic Unit Subject mapping table
    console.log("Creating 'academic_unit_subject' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "academic_unit_subject" (
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE CASCADE,
        academic_unit_id TEXT REFERENCES "academic_unit"(id) ON DELETE CASCADE,
        subject_id TEXT REFERENCES "subject"(id) ON DELETE CASCADE,
        PRIMARY KEY (academic_unit_id, subject_id)
      )
    `;

    // 6. Teacher Assignment table
    console.log("Creating 'teacher_assignment' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "teacher_assignment" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE CASCADE,
        teacher_id VARCHAR(255) REFERENCES "admin"(email) ON DELETE CASCADE,
        academic_unit_id TEXT REFERENCES "academic_unit"(id) ON DELETE CASCADE,
        section_id TEXT REFERENCES "section"(id) ON DELETE SET NULL,
        subject_id TEXT REFERENCES "subject"(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 7. Student Enrollment table
    console.log("Creating 'student_enrollment' table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "student_enrollment" (
        id TEXT PRIMARY KEY,
        institution_id TEXT REFERENCES "institution"(id) ON DELETE CASCADE,
        academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE CASCADE,
        student_id VARCHAR(255) REFERENCES "user"(email) ON DELETE CASCADE,
        academic_unit_id TEXT REFERENCES "academic_unit"(id) ON DELETE CASCADE,
        section_id TEXT REFERENCES "section"(id) ON DELETE SET NULL,
        roll_number VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_year_student UNIQUE (academic_year_id, student_id)
      )
    `;

    // 8. Alter quiz table to support academic contexts
    console.log("Adding columns to 'quiz' table...");
    await sql`
      ALTER TABLE "quiz" 
      ADD COLUMN IF NOT EXISTS academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS academic_unit_id TEXT REFERENCES "academic_unit"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS section_id TEXT REFERENCES "section"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS subject_id TEXT REFERENCES "subject"(id) ON DELETE SET NULL
    `;

    // 9. Alter questions table to support academic contexts
    console.log("Adding columns to 'questions' table...");
    await sql`
      ALTER TABLE "questions" 
      ADD COLUMN IF NOT EXISTS academic_year_id TEXT REFERENCES "academic_year"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS academic_unit_id TEXT REFERENCES "academic_unit"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS subject_id TEXT REFERENCES "subject"(id) ON DELETE SET NULL
    `;

    // 10. Add performant indexes
    console.log("Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_academic_year_inst ON "academic_year" (institution_id, status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_academic_unit_inst ON "academic_unit" (institution_id, academic_year_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_section_unit ON "section" (academic_unit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subject_inst ON "subject" (institution_id, academic_year_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_assignment_teacher ON "teacher_assignment" (teacher_id, institution_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_student_enrollment_student ON "student_enrollment" (student_id, academic_year_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quiz_academic ON "quiz" (academic_year_id, academic_unit_id, subject_id)`;

    // 11. Provision legacy default structures for demo-institute
    console.log("Provisioning legacy defaults for 'demo-institute'...");
    
    // Academic Year
    await sql`
      INSERT INTO "academic_year" (id, institution_id, name, start_date, end_date, status)
      VALUES ('legacy-year', 'demo-institute', 'Legacy / Current', '2025-01-01', '2026-12-31', 'active')
      ON CONFLICT (id) DO NOTHING
    `;

    // Academic Unit
    await sql`
      INSERT INTO "academic_unit" (id, institution_id, academic_year_id, parent_id, name, type, status)
      VALUES ('legacy-unit', 'demo-institute', 'legacy-year', NULL, 'General', 'OTHER', 'active')
      ON CONFLICT (id) DO NOTHING
    `;

    // Subject
    await sql`
      INSERT INTO "subject" (id, institution_id, academic_year_id, name, code, description, status)
      VALUES ('legacy-subject', 'demo-institute', 'legacy-year', 'General', 'GEN01', 'Default legacy subject', 'active')
      ON CONFLICT (id) DO NOTHING
    `;

    // Link Subject to Unit
    await sql`
      INSERT INTO "academic_unit_subject" (institution_id, academic_year_id, academic_unit_id, subject_id)
      VALUES ('demo-institute', 'legacy-year', 'legacy-unit', 'legacy-subject')
      ON CONFLICT DO NOTHING
    `;

    // 12. Backfill quizzes and questions
    console.log("Backfilling existing quizzes and questions to legacy defaults...");
    await sql`
      UPDATE "quiz" 
      SET academic_year_id = 'legacy-year', academic_unit_id = 'legacy-unit', subject_id = 'legacy-subject' 
      WHERE institution_id = 'demo-institute' AND academic_year_id IS NULL
    `;

    await sql`
      UPDATE "questions" q
      SET academic_year_id = 'legacy-year', academic_unit_id = 'legacy-unit', subject_id = 'legacy-subject'
      FROM "quiz" z
      WHERE q.eid = z.eid AND z.institution_id = 'demo-institute' AND q.academic_year_id IS NULL
    `;

    // 13. Backfill existing teachers (admin role) and students (user table) to legacy structure
    console.log("Backfilling teacher assignments and student enrollments...");
    
    const teachers = await sql`
      SELECT email FROM "admin" WHERE role = 'admin' AND institution_id = 'demo-institute'
    `;
    for (const t of teachers) {
      const assignId = 'legacy-assign-' + Math.random().toString(36).substring(2, 7);
      await sql`
        INSERT INTO "teacher_assignment" (id, institution_id, academic_year_id, teacher_id, academic_unit_id, section_id, subject_id)
        VALUES (${assignId}, 'demo-institute', 'legacy-year', ${t.email}, 'legacy-unit', NULL, 'legacy-subject')
        ON CONFLICT DO NOTHING
      `;
    }

    const students = await sql`
      SELECT email FROM "user" WHERE institution_id = 'demo-institute'
    `;
    for (const s of students) {
      const enrollId = 'legacy-enroll-' + Math.random().toString(36).substring(2, 7);
      await sql`
        INSERT INTO "student_enrollment" (id, institution_id, academic_year_id, student_id, academic_unit_id, section_id, status)
        VALUES (${enrollId}, 'demo-institute', 'legacy-year', ${s.email}, 'legacy-unit', NULL, 'active')
        ON CONFLICT (academic_year_id, student_id) DO NOTHING
      `;
    }

    console.log("PHASE 2 DB MIGRATIONS COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("Migration execution failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
