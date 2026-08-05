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
    console.log("Checking duplicates in quiz(eid)...");
    const dups = await sql`
      SELECT eid, COUNT(*) FROM "quiz" GROUP BY eid HAVING COUNT(*) > 1
    `;
    console.log(`Found ${dups.length} duplicate eids.`);
    
    if (dups.length === 0) {
      console.log("Adding UNIQUE constraint to quiz(eid)...");
      await sql`
        ALTER TABLE "quiz" ADD CONSTRAINT uq_quiz_eid UNIQUE (eid)
      `;
      console.log("Successfully added unique constraint!");
    } else {
      console.error("Cannot add unique constraint: duplicates exist.");
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
