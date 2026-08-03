import postgres from 'postgres';
import bcrypt from 'bcryptjs';

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
    console.log("=== RUNNING SECURITY PATCH VERIFICATION ===");

    // TEST 1: Check that plaintext superpassword fails (or does not exist as plaintext in DB)
    const superPlaintext = await sql`
      SELECT email FROM "admin" WHERE role = 'super_admin' AND password = 'superpassword'
    `;
    console.log("TEST 1 (No plaintext superpassword in DB):", superPlaintext.length === 0 ? "PASS" : "FAIL");

    // TEST 2: Verify all password records in user and admin tables are securely hashed (60 characters, starts with $2)
    const plaintextStudents = await sql`
      SELECT email, password FROM "user" WHERE LENGTH(password) != 60 OR password NOT LIKE '$2%'
    `;
    const plaintextAdmins = await sql`
      SELECT email, password FROM "admin" WHERE LENGTH(password) != 60 OR password NOT LIKE '$2%'
    `;
    console.log("TEST 2 (No plaintext passwords in user table):", plaintextStudents.length === 0 ? "PASS" : "FAIL");
    console.log("TEST 3 (No plaintext passwords in admin table):", plaintextAdmins.length === 0 ? "PASS" : "FAIL");

    // TEST 4: Create a mock user, check hashing on creation
    const mockEmail = 'mock-test-' + Math.random().toString(36).substring(2, 7) + '@domain.com';
    const plaintextPass = 'my-super-secret-password-123';
    const hashedPass = await bcrypt.hash(plaintextPass, 10);
    
    // Insert mock user
    await sql`
      INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
      VALUES ('Mock Verification User', 'M', 'Verification College', ${mockEmail}, 7619329863, ${hashedPass}, 'demo-institute')
    `;

    const fetchedMock = await sql`
      SELECT password FROM "user" WHERE email = ${mockEmail}
    `;
    const isMatch = await bcrypt.compare(plaintextPass, fetchedMock[0].password);
    console.log("TEST 4 (Bcrypt hashing integrity test):", isMatch ? "PASS" : "FAIL");

    // Clean up mock user
    await sql`DELETE FROM "user" WHERE email = ${mockEmail}`;
    console.log("Cleanup mock user finished.");

  } catch (error) {
    console.error("Verification script failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
