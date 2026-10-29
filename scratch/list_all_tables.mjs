import sql from './db-connection.mjs';

async function main() {
  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    for (const table of tables) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table.table_name}
        ORDER BY ordinal_position
      `;
      console.log(`\nTable: ${table.table_name}`);
      columns.forEach((column) => {
        console.log(`  - ${column.column_name} (${column.data_type}, nullable: ${column.is_nullable})`);
      });
    }
  } catch (error) {
    console.error('Error listing database schema:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
