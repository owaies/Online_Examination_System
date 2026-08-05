import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load env
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
    const constraints = await sql`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'quiz'::regclass
    `;
    console.log("Constraints on quiz table:");
    constraints.forEach(c => {
      console.log(`  Name: ${c.conname} | Type: ${c.contype}`);
    });
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}

main();
