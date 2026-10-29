import sql from './db-connection.mjs';
import bcrypt from 'bcryptjs';

function isBcrypt(password) {
  return typeof password === 'string' && password.length === 60 && /^\$2[ayb]\$/.test(password);
}

async function main() {
  try {
    if (process.env.ALLOW_PASSWORD_HASH_MIGRATION !== 'true') {
      console.error('Refusing to modify password records. Set ALLOW_PASSWORD_HASH_MIGRATION=true only after taking a backup and reviewing the target database.');
      process.exitCode = 1;
      return;
    }

    console.log('Starting guarded password-hashing migration...');
    await sql`ALTER TABLE "user" ALTER COLUMN password TYPE VARCHAR(255)`;
    await sql`ALTER TABLE "admin" ALTER COLUMN password TYPE VARCHAR(255)`;
    await sql`
      ALTER TABLE "admin"
      ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT FALSE
    `;

    const students = await sql`SELECT email, password FROM "user"`;
    const admins = await sql`SELECT email, password, role FROM "admin"`;
    const allRecords = [
      ...students.map((record) => ({ ...record, table: 'user' })),
      ...admins.map((record) => ({ ...record, table: 'admin' })),
    ];
    const invalid = allRecords.filter((record) =>
      !isBcrypt(record.password) &&
      (typeof record.password !== 'string' || record.password.length === 0 || Buffer.byteLength(record.password, 'utf8') > 72)
    );
    if (invalid.length) {
      throw new Error(`${invalid.length} plaintext password record(s) are empty or exceed bcrypt's 72-byte input limit; resolve them before migration.`);
    }

    let updated = 0;
    for (const record of students) {
      if (!isBcrypt(record.password)) {
        const hash = await bcrypt.hash(record.password, 10);
        await sql`UPDATE "user" SET password = ${hash} WHERE email = ${record.email}`;
        updated += 1;
      }
    }
    for (const record of admins) {
      if (!isBcrypt(record.password)) {
        const hash = await bcrypt.hash(record.password, 10);
        await sql`UPDATE "admin" SET password = ${hash} WHERE email = ${record.email}`;
        updated += 1;
      }
    }
    console.log(`Password-hashing migration completed. Updated ${updated} record(s).`);
  } catch (error) {
    console.error('Password-hashing migration failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
