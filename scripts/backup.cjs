// npm run db:backup -- <file>      npm run db:restore -- <file>
// See src/lib/backup.js for what a backup holds and what it leaves out. Uses the same configuration as the
// server (.env): the database named by DATABASE_URL, or the built-in one when there is none.
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');

const [command, file] = process.argv.slice(2);
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

(async () => {
  const db = require('../src/db');
  const { exportBackup, restoreBackup } = require('../src/lib/backup');
  const where = process.env.DATABASE_URL ? 'the PostgreSQL server in DATABASE_URL' : 'the built-in database';
  try {
    if (command === 'backup') {
      if (!file) fail('Say where to write the backup:  npm run db:backup -- backups/2026-10-13.json');
      if (fs.existsSync(file)) fail(`${file} already exists. Choose another name: a backup is never overwritten.`);
      const backup = await exportBackup();
      fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
      try {
        // 'wx': the write itself refuses an existing file, so two backups started together cannot share a name.
        fs.writeFileSync(file, JSON.stringify(backup), { flag: 'wx' });
      } catch (err) {
        if (err.code === 'EEXIST') fail(`${file} already exists. Choose another name: a backup is never overwritten.`);
        throw err;
      }
      const rows = Object.values(backup.tables).reduce((n, t) => n + t.length, 0);
      console.log(`Backup of ${where} written to ${file}: ${rows} rows in ${Object.keys(backup.tables).length} tables.`);
      console.log('It holds personal data in the clear. Keep it where the database secrets are kept.');
    } else if (command === 'restore') {
      if (!file || !fs.existsSync(file)) fail('Name an existing backup file:  npm run db:restore -- backups/2026-10-13.json');
      const counts = await restoreBackup(JSON.parse(fs.readFileSync(file, 'utf8')));
      console.log(`Restored ${file} into ${where}:`);
      for (const [table, n] of Object.entries(counts)) console.log(`  ${table.padEnd(24)} ${n}`);
      console.log('Nobody is signed in after a restore, and devices must turn notifications on again.');
    } else {
      fail('Commands: backup <file> | restore <file>');
    }
  } finally {
    await db.close();
  }
})().catch((err) => fail(err.message));
