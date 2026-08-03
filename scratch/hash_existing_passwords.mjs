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

function isBcrypt(password) {
  return typeof password === 'string' && password.length === 60 && /^\$2[ayb]\$/.test(password);
}

async function main() {
  try {
    console.log("Starting security migration: Password Hashing...");

    // 1. Alter password column types to allow longer hashed passwords (bcrypt is 60 chars)
    console.log("Altering 'user' and 'admin' password column types to VARCHAR(255)...");
    await sql`
      ALTER TABLE "user" ALTER COLUMN password TYPE VARCHAR(255)
    `;
    await sql`
      ALTER TABLE "admin" ALTER COLUMN password TYPE VARCHAR(255)
    `;

    // 2. Add password_change_required column to admin table if not exists
    console.log("Ensuring 'password_change_required' column exists in 'admin'...");
    await sql`
      ALTER TABLE "admin" 
      ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT FALSE
    `;

    // 3. Fetch and hash student passwords
    console.log("Fetching student users...");
    const students = await sql`SELECT email, password FROM "user"`;
    console.log(`Found ${students.length} students. Checking passwords...`);

    let studentHashedCount = 0;
    for (const student of students) {
      if (!isBcrypt(student.password)) {
        const hash = await bcrypt.hash(student.password, 10);
        await sql`
          UPDATE "user" SET password = ${hash} WHERE email = ${student.email}
        `;
        studentHashedCount++;
      }
    }
    console.log(`Successfully hashed and updated ${studentHashedCount} student passwords.`);

    // 4. Fetch and hash admin/teacher passwords
    console.log("Fetching administrators and teachers...");
    const admins = await sql`SELECT email, password, role FROM "admin"`;
    console.log(`Found ${admins.length} administrators/teachers. Checking passwords...`);

    let adminHashedCount = 0;
    for (const adminUser of admins) {
      if (!isBcrypt(adminUser.password)) {
        const hash = await bcrypt.hash(adminUser.password, 10);
        await sql`
          UPDATE "admin" SET password = ${hash} WHERE email = ${adminUser.email}
        `;
        adminHashedCount++;
      }
    }
    console.log(`Successfully hashed and updated ${adminHashedCount} administrator/teacher passwords.`);

    console.log("Security database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
