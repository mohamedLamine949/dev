const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:%24HTqZ2v2-Bmcgz69W@db.jbukpotncgqpgeenvial.supabase.co:5432/postgres' });
pool.query('SELECT 1').then(() => console.log('ok')).catch(e => console.error(e));
