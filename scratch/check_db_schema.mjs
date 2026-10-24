import sql from './db-connection.mjs';

async function main() {
  try {
    const historyCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'history'
    `;
    console.log("history columns:", historyCols);

    const rankCols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rank'
    `;
    console.log("rank columns:", rankCols);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
