import postgres from 'postgres';

let client;

function getClient() {
  if (!client) {
    // Graceful fallbacks for build time compilation
    const user = process.env.DB_USER || 'placeholder';
    const pass = process.env.DB_PASS || 'placeholder';
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const name = process.env.DB_NAME || 'placeholder';
    
    client = postgres({
      host: host,
      port: parseInt(port),
      database: name,
      username: user,
      password: pass,
      ssl: { rejectUnauthorized: false },
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

