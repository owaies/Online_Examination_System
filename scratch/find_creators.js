const fs = require('fs');
const postgres = require('postgres');

// Parse .env.local manually
const env = {};
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const [key, ...valParts] = line.split('=');
    if (key && valParts.length > 0) {
      env[key.trim()] = valParts.join('=').trim();
    }
  });
}

const sql = postgres({
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT || '5432'),
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const users = await sql`
      SELECT name, email, mob FROM "user" LIMIT 50
    `;
    console.log('=== ALL USERS ===');
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

main();
