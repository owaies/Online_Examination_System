import sql from './db-connection.mjs';

async function main() {
  try {
    const constraints = await sql`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'quiz'::regclass
    `;
    console.log("Constraints on quiz table:");
    constraints.forEach(c => {
      console.log(`  Name: ${c.conname} | Type: ${c.contype}`);
    });
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
