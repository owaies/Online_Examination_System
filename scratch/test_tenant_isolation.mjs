import sql from './db-connection.mjs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const mockTenantId = `test-tenant-${randomUUID()}`;
const mockStudentEmail = `student-${randomUUID()}@tenant-test.invalid`;
const mockInstitutionEmail = `institution-${randomUUID()}@tenant-test.invalid`;
const mockMobile = Number(`9${Date.now().toString().slice(-9)}`);

function check(label, passed) {
  console.log(`${label}: ${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) process.exitCode = 1;
}

async function main() {
  try {
    console.log('=== RUNNING TENANT ISOLATION SMOKE CHECKS ===');

    const superAdmin = await sql`
      SELECT email, role, institution_id FROM "admin" WHERE role = 'super_admin'
    `;
    check('Superadmin has no institution', superAdmin.length === 1 && superAdmin[0].institution_id === null);

    const migratedAdmins = await sql`
      SELECT COUNT(*) AS count FROM "admin"
      WHERE role != 'super_admin' AND institution_id IS DISTINCT FROM 'demo-institute'
    `;
    const migratedUsers = await sql`
      SELECT COUNT(*) AS count FROM "user"
      WHERE institution_id IS DISTINCT FROM 'demo-institute'
    `;
    const migratedQuizzes = await sql`
      SELECT COUNT(*) AS count FROM "quiz"
      WHERE institution_id IS DISTINCT FROM 'demo-institute'
    `;
    check('Non-superadmin records use the demo institution', Number(migratedAdmins[0].count) === 0);
    check('User records use the demo institution', Number(migratedUsers[0].count) === 0);
    check('Quiz records use the demo institution', Number(migratedQuizzes[0].count) === 0);

    console.log(`Creating isolated test tenant ${mockTenantId}...`);
    await sql`
      INSERT INTO "institution" (id, name, institution_code, institution_type, email, status)
      VALUES (${mockTenantId}, 'Test Tenant School', ${mockTenantId.toUpperCase()}, 'School', ${mockInstitutionEmail}, 'active')
    `;
    const mockPasswordHash = await bcrypt.hash('temporary-tenant-test-password', 10);
    await sql`
      INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
      VALUES ('Mock Student', 'M', 'Test Tenant School', ${mockStudentEmail}, ${mockMobile}, ${mockPasswordHash}, ${mockTenantId})
    `;

    const mockQuizzes = await sql`
      SELECT * FROM "quiz" WHERE institution_id = ${mockTenantId}
    `;
    check('New tenant has no inherited quizzes', mockQuizzes.length === 0);

    const mockRankings = await sql`
      SELECT u.email FROM "user" u
      LEFT JOIN "rank" r ON r.email = u.email
      WHERE u.institution_id = ${mockTenantId}
    `;
    check('Tenant ranking query contains only its test student',
      mockRankings.length === 1 && mockRankings[0].email === mockStudentEmail);
  } catch (error) {
    console.error('Tenant isolation smoke checks failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await sql`DELETE FROM "user" WHERE institution_id = ${mockTenantId}`;
      await sql`DELETE FROM "institution" WHERE id = ${mockTenantId}`;
    } catch (cleanupError) {
      console.error('Could not clean up tenant test data:', cleanupError);
      process.exitCode = 1;
    }
    await sql.end();
  }
}

main();
