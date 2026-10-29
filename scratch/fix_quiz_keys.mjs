import sql from './db-connection.mjs';

async function main() {
  try {
    console.log("Checking duplicates in quiz(eid)...");
    const dups = await sql`
      SELECT eid, COUNT(*) FROM "quiz" GROUP BY eid HAVING COUNT(*) > 1
    `;
    console.log(`Found ${dups.length} duplicate eids.`);
    
    if (dups.length === 0) {
      console.log("Adding UNIQUE constraint to quiz(eid)...");
      await sql`
        ALTER TABLE "quiz" ADD CONSTRAINT uq_quiz_eid UNIQUE (eid)
      `;
      console.log("Successfully added unique constraint!");
    } else {
      console.error("Cannot add unique constraint: duplicates exist.");
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
