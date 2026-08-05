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
    const tables = ['quiz', 'questions', 'options', 'answer', 'history', 'rank', 'institution_setting'];
    for (const t of tables) {
      try {
        console.log(`\n=== Schema for table "${t}" ===`);
        const cols = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${t}
          ORDER BY ordinal_position
        `;
        if (cols.length === 0) {
          console.log("  Table not found or no columns.");
        } else {
          cols.forEach(c => {
            console.log(`  ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
          });
        }
      } catch (err) {
        console.log(`  Error inspecting table ${t}:`, err.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
