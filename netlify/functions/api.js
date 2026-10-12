// The whole API as one Netlify function. The pages themselves are published as files (the "public" folder)
// and never reach this code; netlify.toml sends every /api/* request here.
//
// What differs from `npm start` on a machine of one's own:
//   - the database is a PostgreSQL server (DATABASE_URL); the schema is applied by `npm run db:migrate`
//     before a release, never by a function that starts (DB_SKIP_SCHEMA=1 in the site's environment);
//   - the limits on sign-in attempts are counted in each running copy's own memory, so they are weaker
//     here than on a single server (see .env.example, "Deployment note").
const serverless = require('serverless-http');
const app = require('../../server');

module.exports.handler = serverless(app);
