// Makes the pair of keys that identifies this server to the browsers' push services, and writes it into
// .env if that file has none yet. The private key is never printed.   npm run push:keys
const fs = require('node:fs');
const path = require('node:path');
const webpush = require('web-push');

const file = path.join(__dirname, '..', '.env');
const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
if (/^VAPID_PRIVATE_KEY=.+/m.test(text)) {
  console.log('.env already has a pair: nothing was changed. (A new pair would disconnect every device.)');
  process.exit(0);
}
const keys = webpush.generateVAPIDKeys();
// A second secret, of its own: it keeps the stored subscriptions unreadable in the database.
const storeKey = /^PUSH_STORE_KEY=.+/m.test(text) ? null : require('node:crypto').randomBytes(32).toString('base64url');
const cleaned = text.replace(/^VAPID_(PUBLIC|PRIVATE)_KEY=.*\r?\n?/gm, '').replace(storeKey ? /^PUSH_STORE_KEY=.*\r?\n?/gm : /$^/, '');
fs.writeFileSync(file, `${cleaned.replace(/\s*$/, '')}\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n${storeKey ? `PUSH_STORE_KEY=${storeKey}\n` : ''}`);
console.log('A new pair was written to .env. Public key:', keys.publicKey);
console.log('For the hosted site, set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT and PUSH_STORE_KEY in its environment settings.');
