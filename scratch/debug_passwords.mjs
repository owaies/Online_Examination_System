import sql from './db-connection.mjs';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const email = process.env.CHECK_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.CHECK_ADMIN_PASSWORD;
    if (!email || !password) {
      console.error('Set CHECK_ADMIN_EMAIL and CHECK_ADMIN_PASSWORD in an untracked environment file before running this diagnostic.');
      process.exitCode = 1;
      return;
    }

    const records = await sql`
      SELECT email, password, role
      FROM "admin"
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;
    if (records.length === 0) {
      console.error('No administrator matched CHECK_ADMIN_EMAIL.');
      process.exitCode = 1;
      return;
    }

    const record = records[0];
    const storedHash = typeof record.password === 'string' && /^\$2[aby]\$\d\d\$/.test(record.password);
    const matches = storedHash ? await bcrypt.compare(password, record.password) : false;
    console.log(`Administrator found; role: ${record.role}; bcrypt hash stored: ${storedHash}; supplied password matches: ${matches}`);
    if (!storedHash || !matches) process.exitCode = 1;
  } catch (error) {
    console.error('Password diagnostic failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
