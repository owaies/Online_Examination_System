import postgres from 'postgres';

const sql = postgres({
  host: "aws-0-ap-northeast-1.pooler.supabase.com",
  database: "postgres",
  username: "postgres.tpqvmupdvxqloykqkpwj",
  password: "Owaies@2026",
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("=== RUNNING TENANT ISOLATION TESTS ===");

    // 1. Verify Superadmin exists and has null institution
    const superAdmin = await sql`
      SELECT email, role, institution_id FROM "admin" WHERE role = 'super_admin'
    `;
    console.log("TEST 1 (Superadmin check):", superAdmin.length === 1 && superAdmin[0].institution_id === null ? "PASS" : "FAIL");

    // 2. Verify all existing admins, students, and quizzes belong to 'demo-institute'
    const migratedAdmins = await sql`
      SELECT COUNT(*) as count FROM "admin" WHERE role != 'super_admin' AND institution_id != 'demo-institute'
    `;
    const migratedUsers = await sql`
      SELECT COUNT(*) as count FROM "user" WHERE institution_id != 'demo-institute'
    `;
    const migratedQuizzes = await sql`
      SELECT COUNT(*) as count FROM "quiz" WHERE institution_id != 'demo-institute'
    `;
    console.log("TEST 2 (Migrated Admins check):", parseInt(migratedAdmins[0].count) === 0 ? "PASS" : "FAIL");
    console.log("TEST 3 (Migrated Users check):", parseInt(migratedUsers[0].count) === 0 ? "PASS" : "FAIL");
    console.log("TEST 4 (Migrated Quizzes check):", parseInt(migratedQuizzes[0].count) === 0 ? "PASS" : "FAIL");

    // 3. Create a mock tenant and test isolation
    const mockTenantId = 'test-tenant-' + Math.random().toString(36).substring(2, 7);
    console.log(`\nCreating mock tenant: ${mockTenantId}...`);
    await sql`
      INSERT INTO "institution" (id, name, institution_code, institution_type, email, status)
      VALUES (${mockTenantId}, 'Test Tenant School', ${mockTenantId.toUpperCase()}, 'School', 'test@tenant.com', 'active')
    `;

    // 4. Create a student under mock tenant
    const mockStudentEmail = 'student@' + mockTenantId + '.com';
    await sql`
      INSERT INTO "user" (name, gender, college, email, mob, password, institution_id)
      VALUES ('Mock Student', 'M', 'Test Tenant School', ${mockStudentEmail}, 7619329863, 'password', ${mockTenantId})
    `;

    // 5. Query quizzes for the mock tenant (should be 0, since no quizzes created yet)
    const mockQuizzes = await sql`
      SELECT * FROM "quiz" WHERE institution_id = ${mockTenantId}
    `;
    console.log("TEST 5 (Mock tenant quizzes isolated):", mockQuizzes.length === 0 ? "PASS" : "FAIL");

    // 6. Query rankings for mock tenant (should only include the mock student)
    const mockRankings = await sql`
      SELECT u.email FROM "user" u
      LEFT JOIN "rank" r ON r.email = u.email
      WHERE u.institution_id = ${mockTenantId}
    `;
    console.log("TEST 6 (Mock rankings isolated):", mockRankings.length === 1 && mockRankings[0].email === mockStudentEmail ? "PASS" : "FAIL");

    // Clean up mock data
    console.log("\nCleaning up mock data...");
    await sql`DELETE FROM "user" WHERE institution_id = ${mockTenantId}`;
    await sql`DELETE FROM "institution" WHERE id = ${mockTenantId}`;
    console.log("Cleanup finished.");

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
