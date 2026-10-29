import sql from './db-connection.mjs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const mockEmail = `mock-test-${randomUUID()}@tenant-test.invalid`;
const mockMobile = Number(`9${Date.now().toString().slice(-9)}`);
const plaintextPass = 'temporary-test-password-123';

function check(label, passed) {
  console.log(`${label}: ${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) process.exitCode = 1;
}

async function main() {
  try {
    console.log('=== RUNNING SECURITY PATCH VERIFICATION ===');

    const superPlaintext = await sql`
      SELECT email FROM "admin" WHERE role = 'super_admin' AND password = 'superpassword'
    `;
    check('No plaintext legacy superpassword', superPlaintext.length === 0);

    const plaintextStudents = await sql`
      SELECT email FROM "user" WHERE LENGTH(password) != 60 OR password NOT LIKE '$2%'
    `;
    const plaintextAdmins = await sql`
      SELECT email FROM "admin" WHERE LENGTH(password) != 60 OR password NOT LIKE '$2%'
    `;
    check('All student passwords are bcrypt hashes', plaintextStudents.length === 0);
    check('All admin passwords are bcrypt hashes', plaintextAdmins.length === 0);

    const hashedPass = await bcrypt.hash(plaintextPass, 10);
    await sql`
      INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
      VALUES ('Mock Verification User', 'M', 'Verification College', ${mockEmail}, ${mockMobile}, ${hashedPass}, 'demo-institute')
    `;
    const fetchedMock = await sql`
      SELECT password FROM "user" WHERE email = ${mockEmail}
    `;
    const isMatch = fetchedMock.length === 1 && await bcrypt.compare(plaintextPass, fetchedMock[0].password);
    check('Bcrypt hashing round-trip succeeds', isMatch);
  } catch (error) {
    console.error('Security patch verification failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sql`DELETE FROM "user" WHERE email = ${mockEmail}`;
    } catch (cleanupError) {
      console.error('Could not clean up verification user:', cleanupError);
      process.exitCode = 1;
    }
    await sql.end();
  }
}

main();
