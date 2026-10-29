import sql from './db-connection.mjs';

async function main() {
  try {
    const tables = ['quiz', 'questions', 'options', 'answer', 'history', 'rank', 'institution_setting'];
    for (const t of tables) {
      try {
        console.log(`\n=== Schema for table "${t}" ===`);
        const cols = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = ${t}
          ORDER BY ordinal_position
        `;
        if (cols.length === 0) {
          console.log("  Table not found or no columns.");
        } else {
          cols.forEach(c => {
            console.log(`  ${c.column_name}: ${c.data_type} (${c.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
          });
        }
      } catch (err) {
        console.log(`  Error inspecting table ${t}:`, err.message);
      }
    }
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
