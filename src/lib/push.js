// Web Push: the subscriptions of browsers and phones, and sending to them.
//
// A subscription is an address at the browser vendor's push service plus two keys. The address alone lets
// anybody who knows it try to send to that device, so it is kept encrypted, never logged and never given
// back to a client. A subscription belongs to the session it was made in: when that session ends (sign-out,
// a change of password, expiry) the device stops receiving, without any code remembering to say so.
//
// What is sent can appear on a locked screen: it never carries a title, a name or a text of the person's
// data. It says that there is something new and where to look; the app shows the rest after sign-in.
//
// Delivery is "handed to the push service", not "shown": the service, the browser, the phone's settings and
// its battery saver decide the rest. And it is at-least-once at best: a push the service accepted cannot be
// taken back if what follows fails.

const crypto = require('crypto');
const db = require('../db');
const { ValidationError } = require('./validate');

const MAX_DEVICES = 10;
// The push services of the browsers there are. An address anywhere else is not a subscription: the server
// would be made to call a host of somebody's choosing.
// Chrome and the browsers built on it, Firefox, Safari. Apple documents its pattern; Edge on Windows is said
// to use a Microsoft host, which is added here only once a real Edge subscription has shown its name.
const HOSTS = [/^fcm\.googleapis\.com$/, /^([a-z0-9-]+\.)?push\.services\.mozilla\.com$/, /^([a-z0-9-]+\.)?push\.apple\.com$/];
const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

function config() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || (process.env.MAIL_FROM_ADDRESS ? `mailto:${process.env.MAIL_FROM_ADDRESS}` : 'mailto:admin@lifeadmin.local');
  // The key that keeps stored subscriptions unreadable is a secret of its own: it must outlive a change of
  // the VAPID pair, and the other way round.
  const storeKey = process.env.PUSH_STORE_KEY || '';
  return { publicKey, privateKey, subject, storeKey, configured: !!(publicKey && privateKey && storeKey.length >= 32) };
}

// ---- keeping the address and the secret unreadable in the database -----------------------------------------

function storeKey() {
  const secret = config().storeKey;
  if (secret.length < 32) throw new Error('Push is not configured.');
  return Buffer.from(crypto.hkdfSync('sha256', secret, 'lifeadmin', 'push-subscriptions-v1', 32));
}

function seal(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', storeKey(), iv);
  const body = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `v1.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url')}`;
}

function unseal(sealed) {
  const raw = Buffer.from(String(sealed).slice(3), 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', storeKey(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

const hashOf = (endpoint) => crypto.createHash('sha256').update(endpoint).digest('hex');

// ---- subscriptions ----------------------------------------------------------------------------------------

/** What a browser's PushSubscription.toJSON() gives, checked. */
function parseSubscription(input) {
  const bad = () => new ValidationError('This is not a push subscription.', { subscription: 'Invalid' });
  if (!input || typeof input !== 'object') throw bad();
  const { endpoint, keys } = input;
  if (typeof endpoint !== 'string' || endpoint.length > 1024 || !keys || typeof keys !== 'object') throw bad();
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw bad();
  }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !HOSTS.some((h) => h.test(url.hostname))) throw bad();
  const { p256dh, auth } = keys;
  if (typeof p256dh !== 'string' || p256dh.length < 40 || p256dh.length > 200 || !B64URL.test(p256dh)) throw bad();
  if (typeof auth !== 'string' || auth.length < 10 || auth.length > 64 || !B64URL.test(auth)) throw bad();
  return { endpoint, keys: { p256dh, auth } };
}

/**
 * Binds this browser to this person and this session. A browser has one subscription: if it was bound to
 * another account (somebody else signed in on this device before), that binding ends here.
 */
async function saveSubscription(userId, sessionId, input) {
  const sub = parseSubscription(input);
  const hash = hashOf(sub.endpoint);
  return await db.tx(async () => {
    await db.run('DELETE FROM push_subscriptions WHERE endpoint_hash = ? OR session_id = ?', [hash, sessionId]);
    const row = await db.run('INSERT INTO push_subscriptions (user_id, session_id, endpoint_hash, endpoint, p256dh, auth) VALUES (?,?,?,?,?,?)', [userId, sessionId, hash, seal(sub.endpoint), sub.keys.p256dh, seal(sub.keys.auth)]);
    // The oldest devices beyond the limit go.
    await db.run(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND id NOT IN (SELECT id FROM push_subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT ?)',
      [userId, userId, MAX_DEVICES]
    );
    return row.lastInsertRowid;
  });
}

async function removeForSession(userId, sessionId) {
  return (await db.run('DELETE FROM push_subscriptions WHERE user_id = ? AND session_id = ?', [userId, sessionId])).changes;
}

async function statusFor(userId, sessionId) {
  const here = await db.get('SELECT id FROM push_subscriptions WHERE user_id = ? AND session_id = ?', [userId, sessionId]);
  // Only devices that would really receive: a session that ran out no longer does.
  const all = await db.get("SELECT COUNT(*) AS c FROM push_subscriptions p JOIN sessions s ON s.id = p.session_id WHERE p.user_id = ? AND s.expires_at > datetime('now')", [userId]);
  return { thisDevice: !!here, devices: Number(all.c) };
}

// ---- sending ----------------------------------------------------------------------------------------------

// Replaceable, so that tests never call a push service.
// How long one call to a push service may take. The library's own timeout only notices a connection that
// has gone silent; a service that keeps sending a little would keep it open. So the call is also raced
// against a clock here: after this long the attempt is counted as failed, whatever the other end is doing.
// (The abandoned call may still finish on its own: that is the "at least once" of notify.js.)
const SEND_TIMEOUT_MS = 8000;
function withDeadline(promise, ms) {
  let timer;
  const late = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('push service too slow'), { code: 'PUSH_DEADLINE' })), ms);
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}
// Tests shorten the wait.
const deadlineMs = () => (process.env.NODE_ENV === 'test' && Number(process.env.TEST_PUSH_DEADLINE_MS) > 0 ? Number(process.env.TEST_PUSH_DEADLINE_MS) : SEND_TIMEOUT_MS);
let sender = (subscription, payload, options) => require('web-push').sendNotification(subscription, payload, options);
function setSender(fn) {
  const before = sender;
  sender = fn;
  return () => {
    sender = before;
  };
}

// Only a place inside the app can be opened from a notification.
function safePath(path) {
  return typeof path === 'string' && /^\/(#\/[A-Za-z0-9/_-]{0,80})?$/.test(path) ? path : '/';
}

/**
 * What goes to the device. `kind` chooses one of a few fixed sentences; nothing of the person's own words.
 * `tag` names the event, so that the same event shown twice replaces itself.
 */
function payloadOf({ kind = 'update', path = '/', tag = null } = {}) {
  const KINDS = ['update', 'reminder', 'chat', 'comment', 'task', 'test'];
  // A tag is a word and a number ("chat-812"), made by the code that sends: never a person's text.
  return JSON.stringify({ k: KINDS.includes(kind) ? kind : 'update', u: safePath(path), g: typeof tag === 'string' && /^[a-z]{1,16}(-[0-9]{1,18})?$/.test(tag) ? tag : null });
}

async function sendToRow(row, payload, { ttl = 3600, urgency = 'normal' } = {}) {
  const cfg = config();
  let subscription;
  try {
    subscription = { endpoint: unseal(row.endpoint), keys: { p256dh: row.p256dh, auth: unseal(row.auth) } };
  } catch {
    // Stored under a key this server no longer has (PUSH_STORE_KEY was replaced): the row can never be used
    // again. The device has to turn notifications on once more.
    await db.run('DELETE FROM push_subscriptions WHERE id = ?', [row.id]);
    return 'gone';
  }
  try {
    // A person has at most MAX_DEVICES devices, so all of them together stay inside the two minutes for
    // which a push is held (notify.js): ten times eight seconds.
    await withDeadline(
      Promise.resolve(sender(subscription, payload, {
        vapidDetails: { subject: cfg.subject, publicKey: cfg.publicKey, privateKey: cfg.privateKey },
        TTL: ttl,
        urgency,
        timeout: SEND_TIMEOUT_MS,
      })),
      deadlineMs()
    );
    await db.run("UPDATE push_subscriptions SET last_ok_at = datetime('now'), failures = 0 WHERE id = ?", [row.id]);
    return 'sent';
  } catch (err) {
    const status = err && err.statusCode;
    // The push service says this subscription no longer exists: the device unsubscribed or was reset.
    if (status === 404 || status === 410) {
      await db.run('DELETE FROM push_subscriptions WHERE id = ?', [row.id]);
      return 'gone';
    }
    await db.run('UPDATE push_subscriptions SET failures = failures + 1 WHERE id = ?', [row.id]);
    return 'failed';
  }
}

/**
 * To every device of a person whose session is still alive (or to one session only). Answers counts.
 * Never throws for a device that could not be reached.
 */
async function sendToUser(userId, message, { sessionId = null, ...options } = {}) {
  const counts = { sent: 0, gone: 0, failed: 0 };
  if (!config().configured) return counts;
  const rows = await db.all(
    `SELECT p.* FROM push_subscriptions p JOIN sessions s ON s.id = p.session_id
     WHERE p.user_id = ? AND s.expires_at > datetime('now')${sessionId ? ' AND p.session_id = ?' : ''} ORDER BY p.id`,
    sessionId ? [userId, sessionId] : [userId]
  );
  const payload = payloadOf(message);
  for (const row of rows) counts[await sendToRow(row, payload, options)] += 1;
  return counts;
}

module.exports = { config, parseSubscription, saveSubscription, removeForSession, statusFor, sendToUser, payloadOf, setSender, MAX_DEVICES, SEND_TIMEOUT_MS };
