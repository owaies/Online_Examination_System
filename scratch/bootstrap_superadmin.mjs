import sql from './db-connection.mjs';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    console.log('=== SUPER ADMIN SECURE BOOTSTRAP COMMAND ===');

    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!email || !password) {
      console.error('Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD environment variables.');
      process.exitCode = 1;
      return;
    }

    const emailClean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean) || emailClean.length > 254) {
      console.error('SUPER_ADMIN_EMAIL must be a valid email address.');
      process.exitCode = 1;
      return;
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      console.error('SUPER_ADMIN_PASSWORD must be at least 8 characters and at most 72 UTF-8 bytes.');
      process.exitCode = 1;
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await sql`SELECT email FROM "admin" WHERE role = 'super_admin'`;

    if (existing.length > 0) {
      await sql`
        UPDATE "admin"
        SET email = ${emailClean}, password = ${hashedPassword}, password_change_required = false
        WHERE role = 'super_admin'
      `;
      console.log('Super Admin credentials rotated successfully.');
    } else {
      await sql`
        INSERT INTO "admin" (email, password, role, institution_id, password_change_required)
        VALUES (${emailClean}, ${hashedPassword}, 'super_admin', NULL, false)
      `;
      console.log('Super Admin bootstrapped successfully.');
    }

    await sql`
      DELETE FROM "admin"
      WHERE email = 'superadmin@e-examiner.com' AND role = 'super_admin' AND email != ${emailClean}
    `;
    console.log('Legacy superadmin cleanup completed.');
  } catch (error) {
    console.error('Bootstrap execution failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
