import sql from './db-connection.mjs';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const email = process.env.TARGET_ADMIN_EMAIL?.trim().toLowerCase();
    const newPasswordText = process.env.NEW_ADMIN_PASSWORD;
    if (!email || !newPasswordText) {
      console.error('Set TARGET_ADMIN_EMAIL and NEW_ADMIN_PASSWORD before running this script.');
      process.exitCode = 1;
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      console.error('TARGET_ADMIN_EMAIL must be a valid email address.');
      process.exitCode = 1;
      return;
    }
    if (newPasswordText.length < 8 || Buffer.byteLength(newPasswordText, 'utf8') > 72) {
      console.error('NEW_ADMIN_PASSWORD must be at least 8 characters and at most 72 UTF-8 bytes.');
      process.exitCode = 1;
      return;
    }

    console.log(`Resetting password for ${email}...`);
    const hashedPassword = await bcrypt.hash(newPasswordText, 10);
    const result = await sql`
      UPDATE "admin"
      SET password = ${hashedPassword}, password_change_required = false
      WHERE LOWER(email) = ${email}
      RETURNING email, role, institution_id, password_change_required
    `;

    if (result.length === 0) {
      console.error('No administrator matched TARGET_ADMIN_EMAIL.');
      process.exitCode = 1;
      return;
    }
    console.log('Updated administrator record:', JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error('Error resetting administrator password:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
