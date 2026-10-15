import postgres from 'postgres';

let client;

function getClient() {
  if (!client) {
    // Graceful fallbacks for build time compilation
    const user = process.env.DB_USER || 'placeholder';
    const pass = process.env.DB_PASS || 'placeholder';
    const host = process.env.DB_HOST || 'localhost';
    const port = Number.parseInt(process.env.DB_PORT || '5432', 10);
    const name = process.env.DB_NAME || 'placeholder';

    const ssl = process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : process.env.DB_SSL === 'false'
        ? false
        : process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: true }
          : false;

    client = postgres({
      host,
      port,
      database: name,
      username: user,
      password: pass,
      ssl,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      idle_timeout: 20
    });
  }
  return client;
}

// Proxy wrapper delegates all function calls and property access to the lazily initialized client
const sql = new Proxy(() => {}, {
  apply(target, thisArg, argArray) {
    return getClient()(...argArray);
  },
  get(target, prop) {
    const activeClient = getClient();
    const value = activeClient[prop];
    if (typeof value === 'function') {
      return value.bind(activeClient);
    }
    return value;
  }
});

export default sql;
