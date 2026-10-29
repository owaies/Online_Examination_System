import sql from './db-connection.mjs';

async function main() {
  try {
    const counts = await sql`
      SELECT role, COUNT(*)::int AS count
      FROM "admin"
      GROUP BY role
      ORDER BY role
    `;
    console.log('Administrator account counts by role (no account details or passwords):', counts);
  } catch (error) {
    console.error('Could not inspect administrator account counts:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
