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
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in database:", tables.map(t => t.table_name));

    for (const t of tables) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${t.table_name}
        ORDER BY ordinal_position
      `;
      console.log(`\nTable: ${t.table_name}`);
      columns.forEach(c => {
        console.log(`  - ${c.column_name} (${c.data_type}, Nullable: ${c.is_nullable})`);
      });
    }
  } catch (error) {
    console.error("Error listing tables:", error);
  } finally {
    process.exit(0);
  }
}

main();
