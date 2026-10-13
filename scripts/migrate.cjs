// npm run db:migrate            applies src/db/schema.sql to the PostgreSQL server named by DATABASE_URL
// npm run db:migrate -- --local   applies it to the built-in database of this machine
//
// Without DATABASE_URL and without --local it does nothing: "the schema was applied" must never be said
// about a database other than the one that was meant.
require('dotenv').config({ quiet: true });

const local = process.argv.includes('--local');
if (!process.env.DATABASE_URL && !local) {
  console.error('DATABASE_URL is not set, so there is no server to apply the schema to. For the built-in database of this machine: npm run db:migrate -- --local');
  process.exit(1);
}
if (process.env.DATABASE_URL && local) {
  console.error('--local was given but DATABASE_URL is set: the schema would go to that server. Remove one of the two.');
  process.exit(1);
}

(async () => {
  const db = require('../src/db');
  await db.ready();
  const tables = (await db.get("SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'")).n;
  await db.close();
  console.log(`Schema applied to ${local ? 'the built-in database' : 'the PostgreSQL server in DATABASE_URL'}: ${tables} tables.`);
})().catch((err) => {
  console.error('The schema was not applied:', (err && (err.code || err.message)) || 'error');
  process.exit(1);
});
