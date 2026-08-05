import postgres from 'postgres';
import bcrypt from 'bcryptjs';
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
    const email = 'head@gmail.com';
    const newPasswordText = 'Owaies@0110';
    console.log(`Resetting password for ${email} to '${newPasswordText}'...`);
    
    const hashedPassword = await bcrypt.hash(newPasswordText, 10);
    
    const res = await sql`
      UPDATE "admin"
      SET password = ${hashedPassword}, password_change_required = false
      WHERE email = ${email}
      RETURNING email, role, institution_id, password_change_required
    `;
    
    if (res.length > 0) {
      console.log("Success! Updated record:", JSON.stringify(res[0], null, 2));
    } else {
      console.log("User head@gmail.com not found!");
    }
  } catch (err) {
    console.error("Error resetting password:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
