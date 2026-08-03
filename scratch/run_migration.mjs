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
    console.log("Starting E-Examiner Database Migration...");

    // Alter column role size in admin table if needed
    console.log("Altering 'admin' role column to support longer role names...");
    await sql`
      ALTER TABLE "admin" ALTER COLUMN role TYPE VARCHAR(255)
    `;

    // 1. Create institution table
    console.log("Creating 'institution' table if not exists...");
    await sql`
      CREATE TABLE IF NOT EXISTS "institution" (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        institution_code VARCHAR(255) UNIQUE NOT NULL,
        institution_type VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        website VARCHAR(255),
        address TEXT,
        logo_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 2. Add institution_id column to user, admin, and quiz tables
    console.log("Adding columns for multi-tenancy...");
    await sql`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS institution_id TEXT REFERENCES "institution"(id)
    `;
    await sql`
      ALTER TABLE "admin" ADD COLUMN IF NOT EXISTS institution_id TEXT REFERENCES "institution"(id)
    `;
    await sql`
      ALTER TABLE "quiz" ADD COLUMN IF NOT EXISTS institution_id TEXT REFERENCES "institution"(id)
    `;

    // 3. Create default demo institution
    console.log("Creating default institution 'E-Examiner Demo Institute'...");
    await sql`
      INSERT INTO "institution" (id, name, institution_code, institution_type, email, status)
      VALUES (
        'demo-institute', 
        'E-Examiner Demo Institute', 
        'EEXAMINER', 
        'Other', 
        'demo@e-examiner.com', 
        'active'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // 4. Backfill existing records
    console.log("Backfilling 'user' table...");
    await sql`
      UPDATE "user" SET institution_id = 'demo-institute' WHERE institution_id IS NULL
    `;

    console.log("Backfilling 'admin' table...");
    await sql`
      UPDATE "admin" SET institution_id = 'demo-institute' 
      WHERE institution_id IS NULL AND role != 'super_admin'
    `;

    console.log("Backfilling 'quiz' table...");
    await sql`
      UPDATE "quiz" SET institution_id = 'demo-institute' WHERE institution_id IS NULL
    `;



    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
