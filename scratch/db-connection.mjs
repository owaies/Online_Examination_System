import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFiles() {
  const files = [
    process.env.DOTENV_CONFIG_PATH,
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ].filter(Boolean);

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;

      let value = match[2].trim();
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  }
}

loadEnvFiles();

const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_PORT'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(
    `Missing database settings: ${missing.join(', ')}. Set them in the environment, .env.local, or .env.`,
  );
}

const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535.');
}

const ssl = process.env.DB_SSL?.toLowerCase() === 'false'
  ? false
  : {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED?.toLowerCase() !== 'false',
    };

const sql = postgres({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  port,
  ssl,
});

export default sql;
