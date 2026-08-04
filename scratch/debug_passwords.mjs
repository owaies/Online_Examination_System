import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key) process.env[key] = val;
    }
  });
}

const sql = postgres({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("=== PASSWORD VERIFICATION TEST ===\n");

    // Test Super Admin
    const superadmin = await sql`
      SELECT email, password, role FROM "admin" WHERE email = 'eexaminer@superadmin.com'
    `;
    if (superadmin.length > 0) {
      const hasHash = superadmin[0].password.startsWith('$2');
      console.log(`Super Admin: ${superadmin[0].email}`);
      console.log(`  role: ${superadmin[0].role}`);
      console.log(`  password is bcrypt hash: ${hasHash}`);
      console.log(`  hash starts with: ${superadmin[0].password.substring(0, 10)}...`);
      
      const match = await bcrypt.compare('Owaies@0110', superadmin[0].password);
      console.log(`  Password 'Owaies@0110' matches: ${match}`);
    } else {
      console.log("Super Admin NOT FOUND in database!");
    }

    console.log("");

    // Test Institute Admin (head)
    const head = await sql`
      SELECT email, password, role FROM "admin" WHERE email = 'head@gmail.com'
    `;
    if (head.length > 0) {
      const hasHash = head[0].password.startsWith('$2');
      console.log(`Institute Admin: ${head[0].email}`);
      console.log(`  role: ${head[0].role}`);
      console.log(`  password is bcrypt hash: ${hasHash}`);
      console.log(`  hash starts with: ${head[0].password.substring(0, 10)}...`);
      
      // Try known passwords
      const match1 = await bcrypt.compare('Head@1234', head[0].password);
      console.log(`  Password 'Head@1234' matches: ${match1}`);
      
      // Try original/legacy password
      const rawMatch = head[0].password === 'Head@1234' || head[0].password === 'head@1234';
      if (rawMatch) {
        console.log("  WARNING: Password is stored in PLAINTEXT!");
      }
    } else {
      console.log("Institute Admin (head@gmail.com) NOT FOUND in database!");
    }

    console.log("");

    // Test all teachers
    const teachers = await sql`
      SELECT email, password, role FROM "admin" WHERE role = 'admin'
    `;
    for (const t of teachers) {
      const hasHash = t.password.startsWith('$2');
      console.log(`Teacher: ${t.email}`);
      console.log(`  password is bcrypt hash: ${hasHash}`);
      if (!hasHash) {
        console.log(`  WARNING: PASSWORD IS PLAINTEXT: "${t.password.substring(0, 3)}..."`);
      }
    }

    // Check JWT_SECRET env var
    console.log("\n=== ENVIRONMENT VARIABLE CHECK ===");
    console.log(`JWT_SECRET defined: ${!!process.env.JWT_SECRET}`);
    console.log(`DB_HOST defined: ${!!process.env.DB_HOST}`);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

main();
