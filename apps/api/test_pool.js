const { Pool } = require('pg');
const url = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  user: url.username,
  password: decodeURIComponent(url.password),
  host: url.hostname,
  port: url.port,
  database: url.pathname.slice(1)
});
pool.query('SELECT 1').then(() => console.log('PG CONNECTED!')).catch(e => console.error(e));
