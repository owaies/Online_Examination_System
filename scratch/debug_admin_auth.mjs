import postgres from 'postgres';
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
    console.log("=== 1. ALL ADMIN ACCOUNTS (email, role, institution_id, password_change_required) ===");
    const admins = await sql`
      SELECT email, role, institution_id, password_change_required FROM "admin" ORDER BY role, email
    `;
    admins.forEach(a => {
      console.log(`  email=${a.email} | role=${a.role} | institution_id=${a.institution_id} | pwd_change=${a.password_change_required}`);
    });

    console.log("\n=== 2. ALL INSTITUTIONS (id, name, status) ===");
    const institutions = await sql`
      SELECT id, name, institution_code, institution_type, status FROM "institution" ORDER BY name
    `;
    institutions.forEach(i => {
      console.log(`  id=${i.id} | name=${i.name} | code=${i.institution_code} | type=${i.institution_type} | status=${i.status}`);
    });

    console.log("\n=== 3. PHASE 2 TABLES ===");
    const tables = ['academic_year', 'academic_unit', 'section', 'subject', 'teacher_assignment', 'student_enrollment'];
    for (const t of tables) {
      try {
        const count = await sql`SELECT COUNT(*) as cnt FROM ${sql(t)}`;
        console.log(`  ${t}: ${count[0].cnt} rows`);
      } catch (e) {
        console.log(`  ${t}: TABLE MISSING - ${e.message}`);
      }
    }

    console.log("\n=== 4. ADMIN ACCOUNTS WITH role='head' (Institute Admins) ===");
    const heads = await sql`
      SELECT a.email, a.role, a.institution_id, i.name as inst_name, i.status as inst_status
      FROM "admin" a
      LEFT JOIN "institution" i ON a.institution_id = i.id
      WHERE a.role = 'head'
    `;
    if (heads.length === 0) {
      console.log("  NO 'head' role accounts found! This means NO Institute Admin can log in via /admin.");
    } else {
      heads.forEach(h => {
        console.log(`  email=${h.email} | inst_name=${h.inst_name} | inst_status=${h.inst_status}`);
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit(0);
  }
}

main();
