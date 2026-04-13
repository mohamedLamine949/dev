const parse = require('pg-connection-string').parse;
console.log(parse(process.env.DATABASE_URL || 'postgresql://postgres:%24qZ2v2-Bmcgz69W@db.jbukpotncgqpgeenvial.supabase.co:5432/postgres'));
